<?php
namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Category;
use App\Domains\Product\Models\Product;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CategoryApiController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index(Request $request)
    {
        $categories = Category::with('parent')->orderBy('name')->get();
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
                    return $query->where('organization_id', $orgId);
                })
            ],
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean'
        ]);

        $name = $validated['name'];
        $slug = empty($validated['slug']) ? Str::slug($name) : Str::slug($validated['slug']);

        // Check unique slug scoped to organization
        $existingSlugCount = Category::where('organization_id', $orgId)->where('slug', $slug)->count();
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
            'category' => $category->load('parent')
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        $category = Category::with('parent')->findOrFail($id);
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
                    return $query->where('organization_id', $orgId)->where('id', '!=', $category->id);
                })
            ],
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean'
        ]);

        if (!empty($category->slug)) {
            // Slug is immutable once created
            unset($validated['slug']);
        } else if (!empty($validated['name'])) {
            $name = $validated['name'];
            $slug = empty($validated['slug']) ? Str::slug($name) : Str::slug($validated['slug']);

            // Check uniqueness of slug ignoring current id
            $existingSlug = Category::where('organization_id', $orgId)
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
            'category' => $category->load('parent')
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
}
