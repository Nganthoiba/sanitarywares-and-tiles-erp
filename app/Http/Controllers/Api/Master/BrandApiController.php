<?php
namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Brand;
use App\Domains\Product\Models\ProductFamily;
use App\Domains\Product\Models\ProductVariant;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class BrandApiController extends Controller
{
    /**
     * Display a listing of the brands.
     */
    public function index(Request $request)
    {
        $brands = Brand::orderBy('name')->get();
        return response()->json($brands);
    }

    /**
     * Store a newly created brand.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        $name = $validated['name'];
        $slug = empty($validated['slug']) ? Str::slug($name) : Str::slug($validated['slug']);

        // Check unique slug scoped to organization
        $existingSlugCount = Brand::where('organization_id', $orgId)->where('slug', $slug)->count();
        if ($existingSlugCount > 0) {
            $slug = $slug . '-' . time();
        }

        $brand = Brand::create(array_merge($validated, [
            'organization_id' => $orgId,
            'slug' => $slug,
            'is_active' => $request->input('is_active', true)
        ]));

        return response()->json([
            'message' => 'Brand created successfully.',
            'brand' => $brand
        ], 201);
    }

    /**
     * Display the specified brand.
     */
    public function show($id)
    {
        $brand = Brand::findOrFail($id);
        return response()->json($brand);
    }

    /**
     * Update the specified brand.
     */
    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        if (!empty($validated['name'])) {
            $name = $validated['name'];
            $slug = empty($validated['slug']) ? Str::slug($name) : Str::slug($validated['slug']);

            // Check uniqueness of slug ignoring current id
            $existingSlug = Brand::where('organization_id', $orgId)
                ->where('slug', $slug)
                ->where('id', '!=', $brand->id)
                ->first();
            if ($existingSlug) {
                $slug = $slug . '-' . time();
            }
            $validated['slug'] = $slug;
        }

        $brand->update($validated);

        return response()->json([
            'message' => 'Brand updated successfully.',
            'brand' => $brand
        ]);
    }

    /**
     * Remove the specified brand.
     */
    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);

        // Prevent deletion if linked to product families
        $hasFamilies = ProductFamily::where('brand_id', $brand->id)->exists();
        if ($hasFamilies) {
            return response()->json([
                'message' => 'Cannot delete brand because it is linked to active product families.'
            ], 422);
        }

        // Prevent deletion if linked to product variants
        $hasVariants = ProductVariant::where('brand_id', $brand->id)->exists();
        if ($hasVariants) {
            return response()->json([
                'message' => 'Cannot delete brand because it is linked to active product variants.'
            ], 422);
        }

        $brand->delete();

        return response()->json([
            'message' => 'Brand successfully deleted.'
        ]);
    }
}
