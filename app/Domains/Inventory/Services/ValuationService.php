<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryValuation;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Product\Models\Product;
use Illuminate\Support\Facades\DB;
use Exception;

class ValuationService
{
    /**
     * Authoritative Unit Cost Resolution based on Inventory Valuation Business Policy:
     * - SLAB behavior: SPECIFIC IDENTIFICATION (Exact item receipt cost)
     * - BULK behavior: WEIGHTED AVERAGE COST (WAC across receipt history / commercial pricings)
     */
    public function getUnitCost(Product $variant, ?InventoryObject $object = null): float
    {
        $behavior = strtoupper($variant->inventory_behavior ?? 'BULK');

        if ($behavior === 'SLAB') {
            return $this->resolveSpecificIdentificationCost($variant, $object);
        }

        return $this->calculateVariantWAC($variant->organization_id, $variant->id);
    }

    /**
     * Specific Identification Method for Slabs / Unique Items.
     */
    public function resolveSpecificIdentificationCost(Product $variant, ?InventoryObject $object = null): float
    {
        if ($object) {
            // 1. Try to find exact receipt cost on goods_receipt_items
            $grnItem = DB::table('goods_receipt_items')
                ->where('inventory_object_id', $object->id)
                ->where('unit_price', '>', 0)
                ->first();

            if ($grnItem && (float) $grnItem->unit_price > 0) {
                return (float) $grnItem->unit_price;
            }

            // 2. Try match by batch number if set
            if ($object->batch_number) {
                $batchItem = DB::table('goods_receipt_items')
                    ->where('product_variant_id', $variant->id)
                    ->where('batch_number', $object->batch_number)
                    ->where('unit_price', '>', 0)
                    ->first();

                if ($batchItem && (float) $batchItem->unit_price > 0) {
                    return (float) $batchItem->unit_price;
                }
            }
        }

        // 3. Fallback to Commercial Pricing cost price
        return $this->getCommercialPricingCost($variant);
    }

    /**
     * Weighted Average Cost (WAC) Method for Bulk Items (Tiles, Sanitaryware).
     */
    public function calculateVariantWAC(int $organizationId, int $variantId): float
    {
        $grnStats = DB::table('goods_receipt_items')
            ->where('organization_id', $organizationId)
            ->where('product_variant_id', $variantId)
            ->where('unit_price', '>', 0)
            ->where('quantity_accepted', '>', 0)
            ->selectRaw('SUM(quantity_accepted * unit_price) as total_cost, SUM(quantity_accepted) as total_qty')
            ->first();

        if ($grnStats && (float) $grnStats->total_qty > 0) {
            return round((float) $grnStats->total_cost / (float) $grnStats->total_qty, 4);
        }

        // Fallback to variant commercial pricing cost
        $variant = Product::find($variantId);
        return $variant ? $this->getCommercialPricingCost($variant) : 0.0;
    }

    /**
     * Commercial Pricing Cost Price Fallback.
     */
    protected function getCommercialPricingCost(Product $variant): float
    {
        if (!$variant->relationLoaded('currentCommercialPricing')) {
            $variant->load('currentCommercialPricing');
        }

        if ($variant->currentCommercialPricing && (float) $variant->currentCommercialPricing->cost_price > 0) {
            return (float) $variant->currentCommercialPricing->cost_price;
        }

        if (!$variant->relationLoaded('pricings')) {
            $variant->load('pricings');
        }

        $firstPricing = $variant->pricings->first();
        if ($firstPricing && (float) $firstPricing->cost_price > 0) {
            return (float) $firstPricing->cost_price;
        }

        return (float) ($variant->cost_price ?? 0.0);
    }

    /**
     * Calculate total inventory asset valuation for an organization/warehouse.
     */
    public function calculateTotalInventoryValuation(int $organizationId, ?int $warehouseId = null): array
    {
        $query = InventoryObject::where('organization_id', $organizationId)
            ->where('status', 'AVAILABLE')
            ->with(['variant.currentCommercialPricing', 'warehouse']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $objects = $query->get();

        $totalValuation = 0.0;
        $totalQuantity = 0.0;
        $totalArea = 0.0;
        $slabValuation = 0.0;
        $bulkValuation = 0.0;
        $breakdown = [];

        foreach ($objects as $obj) {
            $variant = $obj->variant;
            if (!$variant) continue;

            $unitCost = $this->getUnitCost($variant, $obj);
            $qty = (float) $obj->quantity;
            $area = (float) $obj->area;
            $basis = $area > 0 ? $area : $qty;
            $itemValue = round($basis * $unitCost, 4);

            $totalValuation += $itemValue;
            $totalQuantity += $qty;
            $totalArea += $area;

            $behavior = strtoupper($variant->inventory_behavior ?? 'BULK');
            if ($behavior === 'SLAB') {
                $slabValuation += $itemValue;
            } else {
                $bulkValuation += $itemValue;
            }

            $breakdown[] = [
                'inventory_object_id' => $obj->id,
                'product_variant_id' => $variant->id,
                'product_name' => $variant->name,
                'sku' => $variant->sku,
                'behavior' => $behavior,
                'valuation_method' => $behavior === 'SLAB' ? 'SPECIFIC_IDENTIFICATION' : 'WEIGHTED_AVERAGE_COST',
                'warehouse_name' => $obj->warehouse->name ?? 'N/A',
                'quantity' => $qty,
                'area' => $area,
                'unit_cost' => $unitCost,
                'total_value' => $itemValue,
            ];
        }

        return [
            'organization_id' => $organizationId,
            'warehouse_id' => $warehouseId,
            'total_valuation' => round($totalValuation, 2),
            'slab_valuation' => round($slabValuation, 2),
            'bulk_valuation' => round($bulkValuation, 2),
            'total_quantity' => $totalQuantity,
            'total_area' => $totalArea,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Backward-compatible valuation helper.
     */
    public function calculateValuation(int $objectId, ?string $method = null): array
    {
        $obj = InventoryObject::with('variant')->findOrFail($objectId);
        $variant = $obj->variant;

        $unitCost = $this->getUnitCost($variant, $obj);
        $totalValue = $unitCost * ($obj->area > 0 ? $obj->area : $obj->quantity);
        $usedMethod = $method ?? (strtoupper($variant->inventory_behavior ?? 'BULK') === 'SLAB' ? 'SPECIFIC_ID' : 'WAC');

        InventoryValuation::create([
            'organization_id' => $obj->organization_id,
            'inventory_object_id' => $obj->id,
            'valuation_method' => $usedMethod,
            'unit_cost' => $unitCost,
            'total_value' => $totalValue
        ]);

        return [
            'object_id' => $obj->id,
            'valuation_method' => $usedMethod,
            'unit_cost' => $unitCost,
            'total_value' => $totalValue
        ];
    }
}
