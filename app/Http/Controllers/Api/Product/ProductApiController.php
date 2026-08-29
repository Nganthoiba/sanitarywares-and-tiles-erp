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
            'categories' => Category::where('is_active', true)->orderBy('name')->get(),
            'brands' => Brand::where('organization_id', $orgId)->where('is_active', true)->orderBy('name')->get(),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(),
            'tax_profiles' => TaxProfile::where('is_active', true)->orderBy('name')->get(),
            'manufacturers' => Manufacturer::where('is_active', true)->orderBy('legal_name')->get(),
            'attributes' => ProductAttribute::where('organization_id', $orgId)->with('unit')->orderBy('name')->get(),
            'inventory_behaviors' => ['STANDARD', 'CONVERTIBLE', 'SLAB', 'SERIAL', 'BATCH', 'BUNDLE', 'ROLL']
        ]);
    }

    /**
     * Create a new Product Variant (representing a Product) and map custom attributes.
     */
    public function storeVariant(Request $request)
    {
        $orgId = $request->user()->organization_id;

        // Auto-fill inventory_behavior and UOMs based on product_type if omitted
        if ($request->has('product_type') || !$request->has('inventory_behavior')) {
            $productType = $request->input('product_type', 'STANDARD');

            if ($productType === 'MEASURED_MATERIAL') {
                $request->merge([
                    'inventory_behavior' => $request->input('inventory_behavior', 'SLAB'),
                ]);

                if (!$request->has('purchase_unit_id') || !$request->has('sales_unit_id') || !$request->has('base_unit_id')) {
                    $sqftUnit = Unit::whereIn('symbol', ['SQFT', 'SQ.FT.', 'SQ_FT', 'sq.ft.', 'sq.m'])
                        ->first() ?? Unit::first();
                    if ($sqftUnit) {
                        $request->merge([
                            'purchase_unit_id' => $request->input('purchase_unit_id', $sqftUnit->id),
                            'sales_unit_id' => $request->input('sales_unit_id', $sqftUnit->id),
                            'base_unit_id' => $request->input('base_unit_id', $sqftUnit->id),
                        ]);
                    }
                }
            } else {
                $request->merge([
                    'inventory_behavior' => $request->input('inventory_behavior', 'STANDARD'),
                ]);

                if (!$request->has('purchase_unit_id') || !$request->has('sales_unit_id') || !$request->has('base_unit_id')) {
                    $pcsUnit = Unit::whereIn('symbol', ['PCS', 'pcs', 'PC', 'box'])
                        ->first() ?? Unit::first();
                    if ($pcsUnit) {
                        $request->merge([
                            'purchase_unit_id' => $request->input('purchase_unit_id', $pcsUnit->id),
                            'sales_unit_id' => $request->input('sales_unit_id', $pcsUnit->id),
                            'base_unit_id' => $request->input('base_unit_id', $pcsUnit->id),
                        ]);
                    }
                }
            }
        }

        // Fallback for tax_profile_id if not present
        if (!$request->has('tax_profile_id') || empty($request->input('tax_profile_id'))) {
            $firstTaxProfile = TaxProfile::where('is_active', true)->first();
            if ($firstTaxProfile) {
                $request->merge(['tax_profile_id' => $firstTaxProfile->id]);
            }
        }

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('organization_id', $orgId)
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
            'pieces_per_box' => 'nullable|numeric|min:0.0001',
            'product_type' => 'nullable|string|in:STANDARD,MEASURED_MATERIAL',
            'physical_object' => 'required_if:product_type,MEASURED_MATERIAL|nullable|string|in:SLAB',
            'measurement_unit' => 'required_if:product_type,MEASURED_MATERIAL|nullable|string|in:SQFT,SQ.FT.',
            'attributes' => 'nullable|array',
            'attributes.*.attribute_id' => [
                'required',
                Rule::exists('product_attributes', 'id')->where('organization_id', $orgId)
            ],
            'attributes.*.value' => 'required|string'
        ]);

        $variant = DB::transaction(function () use ($validated, $orgId) {
            $variantData = collect($validated)->except(['attributes', 'pieces_per_box', 'product_type', 'physical_object', 'measurement_unit'])->toArray();

            $variant = Product::create(array_merge($variantData, [
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

            if (!empty($validated['pieces_per_box'])) {
                $boxUnit = Unit::whereIn('symbol', ['BOX', 'box', 'Box'])
                    ->first();
                $pcsUnit = Unit::whereIn('symbol', ['PCS', 'pcs', 'PC'])
                    ->first();

                if ($boxUnit && $pcsUnit) {
                    UnitConversion::create([
                        'organization_id' => $orgId,
                        'product_variant_id' => $variant->id,
                        'from_unit_id' => $boxUnit->id,
                        'to_unit_id' => $pcsUnit->id,
                        'multiplier' => (float) $validated['pieces_per_box'],
                    ]);
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

        // Auto-fill inventory_behavior and UOMs based on product_type if omitted
        if ($request->has('product_type') || !$request->has('inventory_behavior')) {
            $productType = $request->input('product_type', 'STANDARD');

            if ($productType === 'MEASURED_MATERIAL') {
                $request->merge([
                    'inventory_behavior' => $request->input('inventory_behavior', 'SLAB'),
                ]);

                if (!$request->has('purchase_unit_id') || !$request->has('sales_unit_id') || !$request->has('base_unit_id')) {
                    $sqftUnit = Unit::whereIn('symbol', ['SQFT', 'SQ.FT.', 'SQ_FT', 'sqft', 'sq.ft.'])
                        ->first() ?? Unit::first();
                    if ($sqftUnit) {
                        $request->merge([
                            'purchase_unit_id' => $request->input('purchase_unit_id', $sqftUnit->id),
                            'sales_unit_id' => $request->input('sales_unit_id', $sqftUnit->id),
                            'base_unit_id' => $request->input('base_unit_id', $sqftUnit->id),
                        ]);
                    }
                }
            } else {
                $request->merge([
                    'inventory_behavior' => $request->input('inventory_behavior', 'STANDARD'),
                ]);

                if (!$request->has('purchase_unit_id') || !$request->has('sales_unit_id') || !$request->has('base_unit_id')) {
                    $pcsUnit = Unit::whereIn('symbol', ['PCS', 'pcs', 'PC'])
                        ->first() ?? Unit::first();
                    if ($pcsUnit) {
                        $request->merge([
                            'purchase_unit_id' => $request->input('purchase_unit_id', $pcsUnit->id),
                            'sales_unit_id' => $request->input('sales_unit_id', $pcsUnit->id),
                            'base_unit_id' => $request->input('base_unit_id', $pcsUnit->id),
                        ]);
                    }
                }
            }
        }

        // Fallback for tax_profile_id if not present
        if (!$request->has('tax_profile_id') || empty($request->input('tax_profile_id'))) {
            $firstTaxProfile = TaxProfile::where('is_active', true)->first();
            if ($firstTaxProfile) {
                $request->merge(['tax_profile_id' => $firstTaxProfile->id]);
            }
        }

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('organization_id', $orgId)
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

        DB::transaction(function () use ($variant, $validated, $orgId) {
            $variantData = collect($validated)->except(['attributes'])->toArray();
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
            ->whereIn('status', ['ON_HAND', 'RESERVED'])
            ->count();

        $onHandQty = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['ON_HAND', 'RESERVED'])
            ->sum('quantity');

        $reservedQty = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('status', 'RESERVED')
            ->sum('quantity');

        $availableQty = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('status', 'ON_HAND')
            ->sum('quantity');

        $totalArea = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->whereIn('status', ['ON_HAND', 'RESERVED'])
            ->sum('area');

        $reservedArea = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('status', 'RESERVED')
            ->sum('area');

        $availableArea = \App\Domains\Inventory\Models\InventoryObject::where('organization_id', $orgId)
            ->where('product_variant_id', $variant->id)
            ->where('status', 'ON_HAND')
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
}
