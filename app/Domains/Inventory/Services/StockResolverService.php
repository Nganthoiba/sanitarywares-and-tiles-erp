<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Product\Models\Product;
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
    public function resolveStock(int $organizationId, int $productVariantId, int $warehouseId, float $requestedQuantity): array
    {
        if ($requestedQuantity <= 0) {
            throw new Exception("Requested quantity must be greater than zero.");
        }

        // Query available inventory objects for the product in the specified warehouse
        $availableObjects = InventoryObject::where('organization_id', $organizationId)
            ->where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->whereIn('status', ['AVAILABLE', 'ON_HAND'])
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc') // FIFO allocation rule
            ->orderBy('id', 'asc')
            ->get();

        $totalAvailable = (float) $availableObjects->sum('quantity');

        if ($totalAvailable < $requestedQuantity) {
            $productName = Product::find($productVariantId)?->name ?? "Product #{$productVariantId}";
            throw new Exception("Insufficient available stock for '{$productName}'. Requested: {$requestedQuantity}, Available: {$totalAvailable}.");
        }

        $allocations = [];
        $remainingToResolve = $requestedQuantity;

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
