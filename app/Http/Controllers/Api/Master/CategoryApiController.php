<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Category;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CategoryApiController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index(Request $request)
    {
        $categories = Category::with(['parent', 'defaultBaseUnit', 'defaultPurchaseUnit', 'defaultSalesUnit'])->orderBy('name')->get();
        return response()->json($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(function ($query) use ($orgId) {
                    return $query->where(function ($q) use ($orgId) {
                        $q->where('organization_id', $orgId)->orWhereNull('organization_id');
                    });
                })
            ],
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'default_base_unit_id' => 'nullable|exists:units,id',
            'default_purchase_unit_id' => 'nullable|exists:units,id',
            'default_sales_unit_id' => 'nullable|exists:units,id',
        ]);

        $name = $validated['name'];
        $slug = empty($validated['slug']) ? Str::slug($name) : Str::slug($validated['slug']);

        // Check unique slug scoped to organization or global
        $existingSlugCount = Category::where(function ($q) use ($orgId) {
            $q->where('organization_id', $orgId)->orWhereNull('organization_id');
        })->where('slug', $slug)->count();
        if ($existingSlugCount > 0) {
            $slug = $slug . '-' . time();
        }

        $category = Category::create(array_merge($validated, [
            'organization_id' => $orgId,
            'slug' => $slug,
            'is_active' => $request->input('is_active', true),
            'sort_order' => $request->input('sort_order', 0)
        ]));

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category->load(['parent', 'defaultBaseUnit', 'defaultPurchaseUnit', 'defaultSalesUnit'])
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        $category = Category::with(['parent', 'defaultBaseUnit', 'defaultPurchaseUnit', 'defaultSalesUnit'])->findOrFail($id);
        return response()->json($category);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(function ($query) use ($orgId, $category) {
                    return $query->where(function ($q) use ($orgId) {
                        $q->where('organization_id', $orgId)->orWhereNull('organization_id');
                    })->where('id', '!=', $category->id);
                })
            ],
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'default_base_unit_id' => 'nullable|exists:units,id',
            'default_purchase_unit_id' => 'nullable|exists:units,id',
            'default_sales_unit_id' => 'nullable|exists:units,id',
        ]);

        if (!empty($category->slug)) {
            // Slug is immutable once created
            unset($validated['slug']);
        } else if (!empty($validated['name'])) {
            $name = $validated['name'];
            $slug = empty($validated['slug']) ? Str::slug($name) : Str::slug($validated['slug']);

            // Check uniqueness of slug ignoring current id
            $existingSlug = Category::where(function ($q) use ($orgId) {
                $q->where('organization_id', $orgId)->orWhereNull('organization_id');
            })
                ->where('slug', $slug)
                ->where('id', '!=', $category->id)
                ->first();
            if ($existingSlug) {
                $slug = $slug . '-' . time();
            }
            $validated['slug'] = $slug;
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category->load(['parent', 'defaultBaseUnit', 'defaultPurchaseUnit', 'defaultSalesUnit'])
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        // Check if there are child categories
        $hasChildren = Category::where('parent_id', $category->id)->exists();
        if ($hasChildren) {
            return response()->json([
                'message' => 'Cannot delete category because it has subcategories.'
            ], 422);
        }

        // Check if linked to products
        $hasProducts = Product::where('category_id', $category->id)->exists();
        if ($hasProducts) {
            return response()->json([
                'message' => 'Cannot delete category because it is linked to active products.'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category successfully deleted.'
        ]);
    }

    /**
     * Get specifications configured for a category (or inherited from its parent).
     */
    public function getSpecifications($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'category_id' => null,
                'specifications' => []
            ], 200);
        }

        $attributes = $this->getCategoryAttributes($category);

        $formatted = $attributes->map(function ($attr) {
            $allowed = $attr->pivot->allowed_values;
            if (is_string($allowed)) {
                $allowed = json_decode($allowed, true);
            }
            return [
                'attribute_id' => $attr->id,
                'name' => $attr->name,
                'slug' => $attr->slug,
                'type' => $attr->type,
                'unit_id' => $attr->unit_id,
                'unit_symbol' => $attr->unit?->symbol,
                'unit_name' => $attr->unit?->name,
                'is_required' => (bool) $attr->pivot->is_required,
                'sort_order' => (int) $attr->pivot->sort_order,
                'allowed_values' => $allowed ?: null,
            ];
        })->values();

        return response()->json([
            'category_id' => $category->id,
            'category_name' => $category->name,
            'category_slug' => $category->slug,
            'specifications' => $formatted
        ]);
    }

    /**
     * Recursively fetch product attributes from category or parent hierarchy.
     */
    private function getCategoryAttributes(?Category $category)
    {
        if (!$category) {
            return collect();
        }

        $attributes = $category->productAttributes()->with('unit')->get();

        if ($attributes->isNotEmpty()) {
            return $attributes;
        }

        return $this->getCategoryAttributes($category->parent);
    }

    /**
     * Get direct attributes, parent inherited info, and all available system attributes for category management.
     */
    public function getCategoryAttributesManagement($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }

        // Direct attributes assigned specifically to this category
        $directAttributes = $category->productAttributes()->with('unit')->get()->map(function ($attr) {
            $allowed = $attr->pivot->allowed_values;
            if (is_string($allowed)) {
                $allowed = json_decode($allowed, true);
            }
            return [
                'attribute_id' => $attr->id,
                'name' => $attr->name,
                'slug' => $attr->slug,
                'type' => $attr->type,
                'unit_id' => $attr->unit_id,
                'unit_symbol' => $attr->unit?->symbol,
                'unit_name' => $attr->unit?->name,
                'is_required' => (bool) $attr->pivot->is_required,
                'sort_order' => (int) $attr->pivot->sort_order,
                'allowed_values' => $allowed ?: [],
            ];
        })->values();

        // Check inherited attributes if direct attributes are empty
        $inheritedFromCategory = null;
        $inheritedAttributes = [];
        if ($directAttributes->isEmpty() && $category->parent) {
            $parent = $category->parent;
            while ($parent) {
                $parentAttrs = $parent->productAttributes()->with('unit')->get();
                if ($parentAttrs->isNotEmpty()) {
                    $inheritedFromCategory = [
                        'id' => $parent->id,
                        'name' => $parent->name
                    ];
                    $inheritedAttributes = $parentAttrs->map(function ($attr) {
                        $allowed = $attr->pivot->allowed_values;
                        if (is_string($allowed)) {
                            $allowed = json_decode($allowed, true);
                        }
                        return [
                            'attribute_id' => $attr->id,
                            'name' => $attr->name,
                            'slug' => $attr->slug,
                            'type' => $attr->type,
                            'unit_id' => $attr->unit_id,
                            'unit_symbol' => $attr->unit?->symbol,
                            'unit_name' => $attr->unit?->name,
                            'is_required' => (bool) $attr->pivot->is_required,
                            'sort_order' => (int) $attr->pivot->sort_order,
                            'allowed_values' => $allowed ?: [],
                        ];
                    })->values();
                    break;
                }
                $parent = $parent->parent;
            }
        }

        // Available product attributes in system
        $allSystemAttributes = ProductAttribute::with('unit')->orderBy('name')->get()->map(function ($attr) {
            return [
                'id' => $attr->id,
                'name' => $attr->name,
                'slug' => $attr->slug,
                'type' => $attr->type,
                'unit_id' => $attr->unit_id,
                'unit_symbol' => $attr->unit?->symbol,
                'unit_name' => $attr->unit?->name,
            ];
        });

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ],
            'direct_attributes' => $directAttributes,
            'inherited_from' => $inheritedFromCategory,
            'inherited_attributes' => $inheritedAttributes,
            'available_attributes' => $allSystemAttributes
        ]);
    }

    /**
     * Update/sync category product specification attributes.
     */
    public function updateCategoryAttributes($id, Request $request)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }

        $validated = $request->validate([
            'attributes' => 'nullable|array',
            'attributes.*.attribute_id' => 'required|integer|exists:product_attributes,id',
            'attributes.*.is_required' => 'nullable|boolean',
            'attributes.*.sort_order' => 'nullable|integer',
            'attributes.*.allowed_values' => 'nullable'
        ]);

        $syncData = [];
        if (!empty($validated['attributes'])) {
            foreach ($validated['attributes'] as $item) {
                $allowed = $item['allowed_values'] ?? null;
                if (is_array($allowed)) {
                    $allowed = json_encode(array_values(array_filter($allowed)));
                } elseif (is_string($allowed) && trim($allowed) !== '') {
                    $parts = array_map('trim', explode(',', $allowed));
                    $allowed = json_encode(array_values(array_filter($parts)));
                } else {
                    $allowed = null;
                }

                $syncData[$item['attribute_id']] = [
                    'is_required' => !empty($item['is_required']),
                    'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : 0,
                    'allowed_values' => $allowed
                ];
            }
        }

        $category->productAttributes()->sync($syncData);

        return response()->json([
            'message' => 'Category product specification attributes updated successfully.',
            'category_id' => $category->id
        ]);
    }
}
