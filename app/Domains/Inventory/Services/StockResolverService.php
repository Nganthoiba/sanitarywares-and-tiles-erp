<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\UnitConversion;
use Exception;

class StockResolverService
{
    /**
     * Resolve available inventory objects for a given product and warehouse to fulfill a requested quantity.
     * Returns an array of resolved allocations:
     * [
     *   [
     *     'object' => InventoryObject,
     *     'quantity' => float,
     *     'area' => float
     *   ],
     *   ...
     * ]
     *
     * @throws Exception if available stock is insufficient.
     */
    /**
     * Resolve available inventory objects for a given product and warehouse to fulfill a requested quantity.
     * Rule: Stock resolution layer abstracts physical inventory objects away from high-level user operations.
     *
     * Returns an array of resolved allocations:
     * [
     *   [
     *     'object' => InventoryObject,
     *     'quantity' => float,
     *     'area' => float
     *   ],
     *   ...
     * ]
     *
     * @throws Exception if available stock is insufficient.
     */
    public function resolveStock(int $organizationId, int $productVariantId, int $warehouseId, float $requestedQuantity, ?int $unitId = null): array
    {
        if ($requestedQuantity <= 0) {
            throw new Exception("Requested quantity must be greater than zero.");
        }

        $variant = Product::where('organization_id', $organizationId)->find($productVariantId);
        $baseQty = $requestedQuantity;

        // Perform unit conversion to base unit if a specific unit_id is provided
        if ($variant && $unitId && $unitId !== $variant->base_unit_id) {
            $conversion = UnitConversion::where('product_variant_id', $variant->id)
                ->where('from_unit_id', $unitId)
                ->where('to_unit_id', $variant->base_unit_id)
                ->first();
            if ($conversion) {
                $baseQty = $requestedQuantity * (float) $conversion->multiplier;
            }
        }

        // Query available inventory objects for the product in the specified warehouse with pessimistic row locking
        $availableObjects = InventoryObject::where('organization_id', $organizationId)
            ->where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND'])
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc') // FIFO allocation rule
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        $totalAvailable = (float) $availableObjects->sum('quantity');

        if ($totalAvailable < $baseQty) {
            $productName = $variant?->name ?? "Product #{$productVariantId}";
            throw new Exception("Insufficient available stock for '{$productName}'. Requested: {$baseQty}, Available: {$totalAvailable}.");
        }

        $allocations = [];
        $remainingToResolve = $baseQty;

        foreach ($availableObjects as $obj) {
            if ($remainingToResolve <= 0) {
                break;
            }

            $currentQty = (float) $obj->quantity;
            $takeQty = min($currentQty, $remainingToResolve);
            $areaRatio = $currentQty > 0 ? ((float) $obj->area / $currentQty) : 0.0;
            $takeArea = $takeQty * $areaRatio;

            $allocations[] = [
                'object' => $obj,
                'quantity' => $takeQty,
                'area' => $takeArea
            ];

            $remainingToResolve -= $takeQty;
        }

        return $allocations;
    }
}
