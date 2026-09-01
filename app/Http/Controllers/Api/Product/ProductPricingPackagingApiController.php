<?php

namespace App\Http\Controllers\Api\Product;

use App\Http\Controllers\Controller;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\OrganizationProductPricing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductPricingPackagingApiController extends Controller
{
    /**
     * Display a listing of product variants with organization commercial pricing & packaging settings.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $query = Product::where('organization_id', $orgId)
            ->with([
                'category',
                'brand',
                'manufacturer',
                'currentCommercialPricing' => function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId);
                },
                'currentCommercialPricing.priceBasisUnit'
            ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('gtin', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'priced') {
                $query->whereHas('currentCommercialPricing', function ($pq) use ($orgId) {
                    $pq->where('organization_id', $orgId)
                       ->whereNotNull('cost_price')
                       ->whereNotNull('selling_price');
                });
            } elseif ($request->status === 'unpriced') {
                $query->whereDoesntHave('currentCommercialPricing', function ($pq) use ($orgId) {
                    $pq->where('organization_id', $orgId)
                       ->whereNotNull('cost_price')
                       ->whereNotNull('selling_price');
                });
            }
        }

        $perPage = (int) $request->query('per_page', 15);
        $products = $query->orderBy('name', 'asc')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Display commercial pricing details & history for a specific product variant.
     */
    public function show(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;

        $variant = Product::where('organization_id', $orgId)
            ->with([
                'category',
                'brand',
                'manufacturer',
                'attributeValues.attribute.unit',
                'currentCommercialPricing' => function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId);
                },
                'commercialPricings' => function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)->orderBy('created_at', 'desc')->with('creator');
                }
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $variant
        ]);
    }

    /**
     * Update commercial settings (CP, SP, Price Basis, Packaging) for a product variant.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id;

        $variant = Product::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'price_basis' => ['nullable', 'string', 'max:50'],
            'price_basis_unit_id' => ['nullable', 'exists:units,id'],
            'pieces_per_box' => ['nullable', 'integer', 'min:1'],
            'package_weight_kg' => ['nullable', 'numeric', 'min:0'],
        ]);

        $pricingRecord = DB::transaction(function () use ($variant, $validated, $orgId, $user) {
            // Deactivate previous active commercial pricing records for this variant & org
            OrganizationProductPricing::where('organization_id', $orgId)
                ->where('product_variant_id', $variant->id)
                ->where('is_current', true)
                ->update([
                    'is_current' => false,
                    'effective_to' => now(),
                    'updated_by_user_id' => $user->id,
                ]);

            // Create new active commercial pricing record
            $newPricing = OrganizationProductPricing::create([
                'organization_id' => $orgId,
                'product_variant_id' => $variant->id,
                'cost_price' => $validated['cost_price'] ?? null,
                'selling_price' => $validated['selling_price'] ?? null,
                'price_basis' => $validated['price_basis'] ?? 'PCS',
                'price_basis_unit_id' => $validated['price_basis_unit_id'] ?? null,
                'pieces_per_box' => $validated['pieces_per_box'] ?? null,
                'package_weight_kg' => $validated['package_weight_kg'] ?? null,
                'effective_from' => now(),
                'is_current' => true,
                'created_by_user_id' => $user->id,
            ]);

            // Sync current commercial pieces_per_box to product_variants if applicable
            if (array_key_exists('pieces_per_box', $validated)) {
                $variant->update([
                    'pieces_per_box' => $validated['pieces_per_box']
                ]);
            }

            return $newPricing;
        });

        return response()->json([
            'success' => true,
            'message' => 'Commercial pricing & packaging settings saved successfully.',
            'data' => $pricingRecord->load(['priceBasisUnit', 'creator']),
            'product' => $variant->fresh(['currentCommercialPricing'])
        ]);
    }
}
