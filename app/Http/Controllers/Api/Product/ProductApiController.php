<?php

namespace App\Http\Controllers\Api\Product;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

// Models
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
use App\Domains\Product\Models\UnitConversion;

class ProductApiController extends Controller
{
    /**
     * Retrieve all form data and reference arrays required for product entry.
     */
    public function getFormData(Request $request)
    {
        $orgId = $request->user()->organization_id;

        return response()->json([
            'categories' => Category::where('is_active', true)->with('parent')->orderByRaw('COALESCE(parent_id, id), parent_id IS NOT NULL, sort_order, name')->get(),
            'brands' => Brand::where('is_active', true)->orderBy('name')->get(),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(),
            'tax_profiles' => TaxProfile::where('is_active', true)->orderBy('name')->get(),
            'manufacturers' => Manufacturer::where('is_active', true)->orderBy('legal_name')->get(),
            'attributes' => ProductAttribute::with('unit')->orderBy('name')->get(),
            'inventory_behaviors' => ['STANDARD', 'CONVERTIBLE', 'SLAB', 'SERIAL', 'BATCH', 'BUNDLE', 'ROLL']
        ]);
    }

    /**
     * Create a new Product Variant (representing a Product) and map custom attributes.
     */
    public function storeVariant(Request $request)
    {
        $orgId = $request->user()->organization_id;

        // Derive inventory_behavior and UOMs based on Product Category
        $this->deriveCategoryBehavior($request);

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId)->orWhereNull('organization_id');
                })
            ],
            'brand_id' => [
                'required',
                Rule::exists('brands', 'id')
            ],
            'name' => 'required|string|max:255',
            'sku' => [
                'required',
                'string',
                'max:50',
                Rule::unique('product_variants')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'gtin' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:50',
            'inventory_behavior' => 'required|string|in:STANDARD,CONVERTIBLE,SLAB,SERIAL,BATCH,BUNDLE,ROLL',
            'purchase_unit_id' => [
                'required',
                Rule::exists('units', 'id')
            ],
            'sales_unit_id' => [
                'required',
                Rule::exists('units', 'id')
            ],
            'base_unit_id' => [
                'required',
                Rule::exists('units', 'id')
            ],
            'tax_profile_id' => [
                'nullable',
                Rule::exists('tax_profiles', 'id')
            ],
            'manufacturer_id' => [
                'nullable',
                Rule::exists('manufacturers', 'id')
            ],
            'is_active' => 'boolean',
            'pieces_per_box' => 'nullable',
            'product_type' => 'nullable|string|in:STANDARD,MEASURED_MATERIAL',
            'physical_object' => 'required_if:product_type,MEASURED_MATERIAL|nullable|string|in:SLAB',
            'measurement_unit' => 'required_if:product_type,MEASURED_MATERIAL|nullable|string|in:SQFT,SQ.FT.',
            'attributes' => 'nullable'
        ]);

        // Normalize attributes array/dictionary
        $rawAttributes = $request->input('attributes', []);
        $normalizedAttributes = [];
        if (is_array($rawAttributes)) {
            foreach ($rawAttributes as $key => $item) {
                if (is_array($item) && isset($item['attribute_id'])) {
                    $normalizedAttributes[$item['attribute_id']] = $item['value'] ?? null;
                } else if (!is_array($item)) {
                    $normalizedAttributes[$key] = $item;
                }
            }
        }

        // Validate required category specifications & tile pieces_per_box
        $category = Category::find($validated['category_id']);
        $piecesPerBox = null;
        if ($category && $category->isTileCategory() && $request->filled('pieces_per_box')) {
            $rawPpb = $request->input('pieces_per_box');
            if (!is_numeric($rawPpb) || (int)$rawPpb != $rawPpb || (int)$rawPpb <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pieces per Box must be a positive whole number.',
                    'errors' => [
                        'pieces_per_box' => ['Pieces per Box must be a positive whole integer greater than zero.']
                    ]
                ], 422);
            }
            $piecesPerBox = (int) $rawPpb;
        }

        if ($category) {
            $specs = $category->productAttributes;
            if ($specs->isEmpty() && $category->parent) {
                $specs = $category->parent->productAttributes;
            }

            foreach ($specs as $spec) {
                $val = $normalizedAttributes[$spec->id] ?? null;
                if ($spec->pivot->is_required) {
                    if ($val === null || $val === '') {
                        return response()->json([
                            'success' => false,
                            'message' => "The field {$spec->name} is required for this product category.",
                            'errors' => [
                                "attributes.{$spec->id}" => ["The {$spec->name} field is required."]
                            ]
                        ], 422);
                    }
                }

                // Numeric validation
                if ($val !== null && $val !== '' && in_array($spec->type, ['number', 'decimal'])) {
                    if (!is_numeric($val) || (float)$val <= 0) {
                        return response()->json([
                            'success' => false,
                            'message' => "The field {$spec->name} must be a positive number.",
                            'errors' => [
                                "attributes.{$spec->id}" => ["The {$spec->name} field must be greater than zero."]
                            ]
                        ], 422);
                    }
                }
            }
        }

        $variant = DB::transaction(function () use ($validated, $normalizedAttributes, $piecesPerBox, $orgId) {
            $variantData = collect($validated)->except(['attributes', 'pieces_per_box', 'product_type', 'physical_object', 'measurement_unit'])->toArray();

            $variant = Product::create(array_merge($variantData, [
                'organization_id' => $orgId,
                'pieces_per_box' => $piecesPerBox,
                'is_active' => $validated['is_active'] ?? true
            ]));

            foreach ($normalizedAttributes as $attrId => $val) {
                if ($val !== null && $val !== '') {
                    ProductAttributeValue::create([
                        'organization_id' => $orgId,
                        'product_variant_id' => $variant->id,
                        'product_attribute_id' => $attrId,
                        'value' => (string) $val
                    ]);
                }
            }

            if ($piecesPerBox && $piecesPerBox > 0) {
                $boxUnit = Unit::whereIn('symbol', ['BOX', 'box', 'Box'])->orWhereIn('name', ['box', 'boxes', 'Box', 'Boxes'])->first() ?? Unit::find($variant->purchase_unit_id);
                $pcsUnit = Unit::whereIn('symbol', ['PCS', 'pcs', 'PC', 'pc'])->orWhereIn('name', ['piece', 'pieces', 'Piece', 'Pieces'])->first() ?? Unit::find($variant->base_unit_id);

                if ($boxUnit && $pcsUnit && $boxUnit->id !== $pcsUnit->id) {
                    UnitConversion::updateOrCreate(
                        [
                            'organization_id' => $orgId,
                            'product_variant_id' => $variant->id,
                            'from_unit_id' => $boxUnit->id,
                            'to_unit_id' => $pcsUnit->id,
                        ],
                        [
                            'multiplier' => (float) $piecesPerBox,
                        ]
                    );
                }
            }

            return $variant;
        });

        return response()->json([
            'success' => true,
            'message' => 'Product saved successfully.',
            'data' => $variant->load(['category', 'purchaseUnit', 'salesUnit', 'baseUnit', 'taxProfile', 'brand', 'manufacturer', 'attributeValues.attribute.unit'])
        ], 201);
    }

    /**
     * Create a new custom Product Attribute definition.
     */
    public function storeAttribute(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:string,text,number,list',
            'unit_id' => [
                'nullable',
                Rule::exists('units', 'id')
            ]
        ]);

        $slug = Str::slug($validated['name']);

        // Double check uniqueness of slug for this organization
        $existing = ProductAttribute::where('organization_id', $orgId)->where('slug', $slug)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'An attribute with this name or slug already exists.'
            ], 422);
        }

        $attr = ProductAttribute::create([
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'slug' => $slug,
            'type' => $validated['type'],
            'unit_id' => $validated['unit_id'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product attribute defined successfully.',
            'data' => $attr->load('unit')
        ], 201);
    }

    /**
     * Assign or update an attribute value for a specific product.
     */
    public function assignProductAttribute(Request $request, $productId)
    {
        $orgId = $request->user()->organization_id;
        $product = Product::where('organization_id', $orgId)->findOrFail($productId);

        $validated = $request->validate([
            'attribute_id' => [
                'required',
                Rule::exists('product_attributes', 'id')->where('organization_id', $orgId)
            ],
            'value' => 'required|string'
        ]);

        $attributeValue = ProductAttributeValue::updateOrCreate(
            [
                'organization_id' => $orgId,
                'product_variant_id' => $product->id,
                'product_attribute_id' => $validated['attribute_id'],
            ],
            [
                'value' => $validated['value']
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Product attribute assigned successfully.',
            'data' => $attributeValue->load('attribute.unit')
        ]);
    }

    /**
     * Remove an attribute assignment from a specific product.
     */
    public function removeProductAttribute(Request $request, $productId, $attributeId)
    {
        $orgId = $request->user()->organization_id;
        $product = Product::where('organization_id', $orgId)->findOrFail($productId);
        $attribute = ProductAttribute::where('organization_id', $orgId)->findOrFail($attributeId);

        $deleted = ProductAttributeValue::where('organization_id', $orgId)
            ->where('product_variant_id', $product->id)
            ->where('product_attribute_id', $attribute->id)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Attribute assignment not found for this product.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Attribute specification removed from product successfully.'
        ]);
    }

    /**
     * Retrieve a list of all product variants.
     */
    public function listVariants(Request $request)
    {
        $orgId = $request->user()->organization_id;
        return response()->json(
            Product::where('organization_id', $orgId)
                ->with(['category', 'purchaseUnit', 'salesUnit', 'baseUnit', 'taxProfile', 'brand', 'manufacturer', 'attributeValues.attribute.unit'])
                ->orderBy('name')
                ->get()
        );
    }

    public function showVariant(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $variant = Product::where('organization_id', $orgId)
            ->with(['category', 'purchaseUnit', 'salesUnit', 'baseUnit', 'taxProfile', 'brand', 'manufacturer', 'attributeValues.attribute.unit'])
            ->findOrFail($id);

        return response()->json($variant);
    }

    public function updateVariant(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $variant = Product::where('organization_id', $orgId)->findOrFail($id);

        // Derive inventory_behavior and UOMs based on Product Category
        $this->deriveCategoryBehavior($request);

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId)->orWhereNull('organization_id');
                })
            ],
            'brand_id' => [
                'required',
                Rule::exists('brands', 'id')->where('organization_id', $orgId)
            ],
            'name' => 'required|string|max:255',
            'sku' => [
                'required',
                'string',
                'max:50',
                Rule::unique('product_variants')->ignore($variant->id)->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'gtin' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:50',
            'inventory_behavior' => 'required|string|in:STANDARD,CONVERTIBLE,SLAB,SERIAL,BATCH,BUNDLE,ROLL',
            'pieces_per_box' => 'nullable',
            'primary_unit_id' => [
                'sometimes',
                'required',
                Rule::exists('units', 'id')
            ],
            'secondary_unit_id' => [
                'nullable',
                Rule::exists('units', 'id')
            ],
            'pricing_unit_id' => [
                'sometimes',
                'required',
                Rule::exists('units', 'id')
            ],
            'tax_profile_id' => [
                'required',
                Rule::exists('tax_profiles', 'id')
            ],
            'manufacturer_id' => [
                'nullable',
                Rule::exists('manufacturers', 'id')
            ],
            'is_active' => 'boolean',
            'attributes' => 'nullable|array',
            'attributes.*.attribute_id' => [
                'required',
                Rule::exists('product_attributes', 'id')->where('organization_id', $orgId)
            ],
            'attributes.*.value' => 'required|string'
        ]);

        $category = Category::find($validated['category_id']);
        $piecesPerBox = null;
        if ($category && $category->isTileCategory()) {
            if ($request->filled('pieces_per_box')) {
                $rawPpb = $request->input('pieces_per_box');
                if (!is_numeric($rawPpb) || (int)$rawPpb != $rawPpb || (int)$rawPpb <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pieces per Box must be a positive whole number.',
                        'errors' => [
                            'pieces_per_box' => ['Pieces per Box must be a positive whole integer greater than zero.']
                        ]
                    ], 422);
                }
                $piecesPerBox = (int) $rawPpb;
            } else {
                $piecesPerBox = $variant->pieces_per_box;
            }
        }

        DB::transaction(function () use ($variant, $validated, $piecesPerBox, $orgId) {
            $variantData = collect($validated)->except(['attributes', 'pieces_per_box'])->toArray();
            $variantData['pieces_per_box'] = $piecesPerBox;
            $variant->update($variantData);

            if (isset($validated['attributes'])) {
                $submittedAttrIds = collect($validated['attributes'])->pluck('attribute_id')->toArray();
                ProductAttributeValue::where('product_variant_id', $variant->id)
                    ->whereNotIn('product_attribute_id', $submittedAttrIds)
                    ->delete();

                foreach ($validated['attributes'] as $attr) {
                    ProductAttributeValue::updateOrCreate(
                        [
                            'organization_id' => $orgId,
                            'product_variant_id' => $variant->id,
                            'product_attribute_id' => $attr['attribute_id']
                        ],
                        [
                            'value' => $attr['value']
                        ]
                    );
                }
            }

            if ($piecesPerBox && $piecesPerBox > 0) {
                $boxUnit = Unit::whereIn('symbol', ['BOX', 'box', 'Box'])->orWhereIn('name', ['box', 'boxes', 'Box', 'Boxes'])->first() ?? Unit::find($variant->purchase_unit_id);
                $pcsUnit = Unit::whereIn('symbol', ['PCS', 'pcs', 'PC', 'pc'])->orWhereIn('name', ['piece', 'pieces', 'Piece', 'Pieces'])->first() ?? Unit::find($variant->base_unit_id);

                if ($boxUnit && $pcsUnit && $boxUnit->id !== $pcsUnit->id) {
                    UnitConversion::updateOrCreate(
                        [
                            'organization_id' => $orgId,
                            'product_variant_id' => $variant->id,
                            'from_unit_id' => $boxUnit->id,
                            'to_unit_id' => $pcsUnit->id,
                        ],
                        [
                            'multiplier' => (float) $piecesPerBox,
                        ]
                    );
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => $variant->load(['category', 'purchaseUnit', 'salesUnit', 'baseUnit', 'taxProfile', 'brand', 'manufacturer', 'attributeValues.attribute.unit'])
        ]);
    }

    public function listConversions(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $variant = Product::where('organization_id', $orgId)->findOrFail($id);

        $conversions = UnitConversion::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->with(['fromUnit', 'toUnit'])
            ->get();

        return response()->json($conversions);
    }

    public function storeConversion(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $variant = Product::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'from_unit_id' => 'required|exists:units,id',
            'to_unit_id' => 'required|exists:units,id',
            'multiplier' => 'required|numeric|min:0.000001'
        ]);

        // Ensure no duplicate conversion from-to for this variant
        $exists = UnitConversion::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('from_unit_id', $validated['from_unit_id'])
            ->where('to_unit_id', $validated['to_unit_id'])
            ->first();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'This unit conversion already exists.'
            ], 422);
        }

        $conversion = UnitConversion::create([
            'organization_id' => $orgId,
            'product_variant_id' => $variant->id,
            'from_unit_id' => $validated['from_unit_id'],
            'to_unit_id' => $validated['to_unit_id'],
            'multiplier' => $validated['multiplier']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit conversion added successfully.',
            'data' => $conversion->load(['fromUnit', 'toUnit'])
        ], 201);
    }

    public function deleteConversion(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $conversion = UnitConversion::where('organization_id', $orgId)->findOrFail($id);
        $conversion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Unit conversion deleted successfully.'
        ]);
    }

    public function getInventorySummary(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $variant = Product::where('organization_id', $orgId)->findOrFail($id);

        $onHandCount = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND', 'RESERVED'])
            ->count();

        $onHandQty = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND', 'RESERVED'])
            ->sum('quantity');

        $reservedQty = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('status', 'RESERVED')
            ->sum('quantity');

        $availableQty = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND'])
            ->sum('quantity');

        $totalArea = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND', 'RESERVED'])
            ->sum('area');

        $reservedArea = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('status', 'RESERVED')
            ->sum('area');

        $availableArea = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND'])
            ->sum('area');

        return response()->json([
            'is_measured' => ($variant->inventory_behavior === 'SLAB'),
            'standard' => [
                'current_stock' => (float)$onHandQty,
                'reserved_stock' => (float)$reservedQty,
                'available_stock' => (float)$availableQty
            ],
            'measured' => [
                'current_slabs' => $onHandCount,
                'total_area' => (float)$totalArea,
                'reserved_area' => (float)$reservedArea,
                'available_area' => (float)$availableArea
            ]
        ]);
    }

    /**
     * Derive internal product_type, inventory_behavior and UOM defaults server-side from Category.
     */
    protected function deriveCategoryBehavior(Request $request): void
    {
        $categoryId = $request->input('category_id');
        $category = $categoryId ? Category::with('parent')->find($categoryId) : null;
        $slug = strtolower($category?->slug ?? '');
        $parentSlug = strtolower($category?->parent?->slug ?? '');

        $isSlabCategory = str_contains($slug, 'granite') || str_contains($slug, 'marble') || str_contains($slug, 'slab') ||
            str_contains($parentSlug, 'granite') || str_contains($parentSlug, 'marble') || str_contains($parentSlug, 'slab');

        $inputProductType = $request->input('product_type');
        $inputInventoryBehavior = $request->input('inventory_behavior');
        $hasExplicitProductType = $request->has('product_type');

        // Auto-fill UOM defaults from Category if omitted in request
        $resolvedUnits = $category ? $category->getResolvedDefaultUnits() : ['base_unit_id' => null, 'purchase_unit_id' => null, 'sales_unit_id' => null];

        // Check if measured material is indicated by explicit input OR by category slug
        if ($inputProductType === 'MEASURED_MATERIAL' || in_array($inputInventoryBehavior, ['SLAB']) || $isSlabCategory) {
            $inventoryBehavior = $inputInventoryBehavior ?? 'SLAB';
            $productType = $inputProductType ?? 'MEASURED_MATERIAL';

            $request->merge([
                'inventory_behavior' => $inventoryBehavior,
                'product_type' => $productType,
            ]);

            // Auto-fill UOMs if omitted
            if (!$request->has('purchase_unit_id') || !$request->has('sales_unit_id') || !$request->has('base_unit_id')) {
                $sqftUnit = Unit::whereIn('symbol', ['SQFT', 'SQ.FT.', 'SQ_FT', 'sqft', 'sq.ft.', 'sq.m'])->first() ?? Unit::first();
                $defaultBase = $resolvedUnits['base_unit_id'] ?? $sqftUnit?->id;
                $defaultPurchase = $resolvedUnits['purchase_unit_id'] ?? $sqftUnit?->id;
                $defaultSales = $resolvedUnits['sales_unit_id'] ?? $sqftUnit?->id;

                $request->merge([
                    'purchase_unit_id' => $request->input('purchase_unit_id', $defaultPurchase),
                    'sales_unit_id' => $request->input('sales_unit_id', $defaultSales),
                    'base_unit_id' => $request->input('base_unit_id', $defaultBase),
                ]);
            }

            // Auto-fill physical_object and measurement_unit defaults ONLY if product_type was NOT explicitly provided without them
            if (!$hasExplicitProductType) {
                if (!$request->has('physical_object')) {
                    $request->merge(['physical_object' => 'SLAB']);
                }
                if (!$request->has('measurement_unit')) {
                    $request->merge(['measurement_unit' => 'SQFT']);
                }
            }
        } else {
            $inventoryBehavior = $inputInventoryBehavior ?? 'STANDARD';
            $productType = $inputProductType ?? 'STANDARD';

            $request->merge([
                'inventory_behavior' => $inventoryBehavior,
                'product_type' => $productType,
            ]);

            if (!$request->has('purchase_unit_id') || !$request->has('sales_unit_id') || !$request->has('base_unit_id')) {
                $pcsUnit = Unit::whereIn('symbol', ['PCS', 'pcs', 'PC', 'box', 'BOX'])->first() ?? Unit::first();
                $defaultBase = $resolvedUnits['base_unit_id'] ?? $pcsUnit?->id;
                $defaultPurchase = $resolvedUnits['purchase_unit_id'] ?? $pcsUnit?->id;
                $defaultSales = $resolvedUnits['sales_unit_id'] ?? $pcsUnit?->id;

                $request->merge([
                    'purchase_unit_id' => $request->input('purchase_unit_id', $defaultPurchase),
                    'sales_unit_id' => $request->input('sales_unit_id', $defaultSales),
                    'base_unit_id' => $request->input('base_unit_id', $defaultBase),
                ]);
            }
        }

        if (!$request->has('tax_profile_id') || empty($request->input('tax_profile_id'))) {
            $firstTaxProfile = TaxProfile::where('is_active', true)->first();
            if ($firstTaxProfile) {
                $request->merge(['tax_profile_id' => $firstTaxProfile->id]);
            }
        }
    }
}
