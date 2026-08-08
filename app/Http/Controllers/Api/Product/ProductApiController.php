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
use App\Domains\Product\Models\ProductFamily;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;

class ProductApiController extends Controller
{
    /**
     * Retrieve all form data and reference arrays required for product entry.
     */
    public function getFormData(Request $request)
    {
        $orgId = $request->user()->organization_id;

        return response()->json([
            'categories' => Category::where('is_active', true)->orderBy('name')->get(),
            'brands' => Brand::where('is_active', true)->orderBy('name')->get(),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(),
            'tax_profiles' => TaxProfile::where('is_active', true)->orderBy('name')->get(),
            'manufacturers' => Manufacturer::orderBy('name')->get(),
            'attributes' => ProductAttribute::orderBy('name')->get(),
            'families' => ProductFamily::with(['category', 'brand', 'taxProfile'])->orderBy('name')->get(),
            'inventory_behaviors' => ['STANDARD', 'CONVERTIBLE', 'SLAB', 'SERIAL', 'BATCH', 'BUNDLE', 'ROLL']
        ]);
    }

    /**
     * Create a new Product Family.
     */
    public function storeFamily(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('product_families')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'tax_profile_id' => 'nullable|exists:tax_profiles,id',
            'description' => 'nullable|string'
        ]);

        $family = ProductFamily::create(array_merge($validated, [
            'organization_id' => $orgId
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Product family created successfully.',
            'data' => $family->load(['category', 'brand', 'taxProfile'])
        ], 201);
    }

    /**
     * Create a new Product Variant and map custom attributes.
     */
    public function storeVariant(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'product_family_id' => 'required|exists:product_families,id',
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
            'purchase_unit_id' => 'required|exists:units,id',
            'sales_unit_id' => 'required|exists:units,id',
            'base_unit_id' => 'required|exists:units,id',
            'tax_profile_id' => 'required|exists:tax_profiles,id',
            'brand_id' => 'nullable|exists:brands,id',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'cost_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'attributes' => 'nullable|array',
            'attributes.*.attribute_id' => 'required|exists:product_attributes,id',
            'attributes.*.value' => 'required|string'
        ]);

        $variant = DB::transaction(function () use ($validated, $orgId) {
            $variantData = collect($validated)->except(['attributes'])->toArray();
            
            $variant = ProductVariant::create(array_merge($variantData, [
                'organization_id' => $orgId,
                'is_active' => $validated['is_active'] ?? true
            ]));

            if (!empty($validated['attributes'])) {
                foreach ($validated['attributes'] as $attr) {
                    ProductAttributeValue::create([
                        'organization_id' => $orgId,
                        'product_variant_id' => $variant->id,
                        'product_attribute_id' => $attr['attribute_id'],
                        'value' => $attr['value']
                    ]);
                }
            }

            return $variant;
        });

        return response()->json([
            'success' => true,
            'message' => 'Product variant created successfully.',
            'data' => $variant->load(['family', 'purchaseUnit', 'salesUnit', 'baseUnit', 'taxProfile', 'brand', 'manufacturer', 'attributeValues.attribute'])
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
            'type' => 'required|string|in:string,text,number,list'
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
            'type' => $validated['type']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product attribute defined successfully.',
            'data' => $attr
        ], 201);
    }

    /**
     * Retrieve a list of all product families.
     */
    public function listFamilies(Request $request)
    {
        return response()->json(
            ProductFamily::with(['category', 'brand', 'taxProfile'])->orderBy('name')->get()
        );
    }

    /**
     * Retrieve a list of all product variants.
     */
    public function listVariants(Request $request)
    {
        return response()->json(
            ProductVariant::with(['family', 'purchaseUnit', 'salesUnit', 'baseUnit', 'taxProfile', 'brand', 'manufacturer', 'attributeValues.attribute'])->orderBy('name')->get()
        );
    }
}
