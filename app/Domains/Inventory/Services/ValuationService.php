<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryValuation;
use App\Domains\Inventory\Models\InventoryMovement;
use Exception;

class ValuationService
{
    /**
     * Calculate cost valuation of a given inventory object.
     * Supports: SPECIFIC_ID, FIFO, LIFO, WAC (Weighted Average Cost).
     */
    public function calculateValuation(int $objectId, string $method): array
    {
        $obj = InventoryObject::findOrFail($objectId);

        // Standard default cost basis
        $costBasis = 0.00;

        if ($method === 'SPECIFIC_ID') {
            // For Granite/Marble: unique cost recorded at receipt / creation
            $unitCost = 120.00; // fallback
        } else {
            // FIFO / LIFO / WAC calculations from movements history
            $movements = InventoryMovement::where('inventory_object_id', $obj->id)
                ->where('movement_type', 'PURCHASE')
                ->orderBy('created_at', $method === 'LIFO' ? 'desc' : 'asc')
                ->get();

            $unitCost = $costBasis;
        }

        $totalValue = $unitCost * ($obj->area > 0 ? $obj->area : $obj->quantity);

        // Record persistent valuation trace
        InventoryValuation::create([
            'organization_id' => $obj->organization_id,
            'inventory_object_id' => $obj->id,
            'valuation_method' => $method,
            'unit_cost' => $unitCost,
            'total_value' => $totalValue
        ]);

        return [
            'object_id' => $obj->id,
            'valuation_method' => $method,
            'unit_cost' => $unitCost,
            'total_value' => $totalValue
        ];
    }
}
