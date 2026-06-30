<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryCount;
use App\Domains\Inventory\Models\InventoryCountItem;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryCountCompleted;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryCountService
{
    public function initiateCount(array $data): InventoryCount
    {
        return DB::transaction(function () use ($data) {
            $count = InventoryCount::create([
                'organization_id' => $data['organization_id'] ?? 1,
                'warehouse_id' => $data['warehouse_id'],
                'count_number' => $data['count_number'] ?? 'CNT-' . uniqid(),
                'count_date' => $data['count_date'] ?? now()->toDateString(),
                'count_type' => $data['count_type'] ?? 'CYCLE', // CYCLE, ANNUAL, BLIND
                'status' => 'PENDING',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['user_id'] ?? null
            ]);

            // Auto-populate all active inventory items in that warehouse for reconciliation
            $objects = InventoryObject::where('warehouse_id', $count->warehouse_id)
                ->where('status', 'ON_HAND')
                ->get();

            foreach ($objects as $obj) {
                InventoryCountItem::create([
                    'inventory_count_id' => $count->id,
                    'inventory_object_id' => $obj->id,
                    'recorded_quantity' => $obj->quantity,
                    'counted_quantity' => $obj->quantity, // default matches until updated
                    'variance_quantity' => 0.0000,
                    'recorded_area' => $obj->area,
                    'counted_area' => $obj->area,
                    'variance_area' => 0.0000
                ]);
            }

            return $count;
        });
    }

    public function updateCountQuantity(int $itemId, float $countedQty, float $countedArea = 0): void
    {
        $item = InventoryCountItem::findOrFail($itemId);

        $item->counted_quantity = $countedQty;
        $item->variance_quantity = $countedQty - $item->recorded_quantity;

        if ($item->recorded_area > 0) {
            $item->counted_area = $countedArea;
            $item->variance_area = $countedArea - $item->recorded_area;
        }

        $item->save();
    }

    public function approveCount(int $countId, int $approverId): void
    {
        DB::transaction(function () use ($countId, $approverId) {
            $count = InventoryCount::findOrFail($countId);
            if ($count->status !== 'PENDING') {
                throw new Exception("Count is already approved or resolved.");
            }

            $count->status = 'APPROVED';
            $count->approved_by = $approverId;
            $count->save();

            // Resolve variances
            foreach ($count->items as $item) {
                if ($item->variance_quantity != 0 || $item->variance_area != 0) {
                    $obj = $item->inventoryObject;

                    // Sync database balance
                    $obj->quantity = $item->counted_quantity;
                    if ($obj->area > 0) {
                        $obj->area = $item->counted_area;
                    }

                    if ($obj->quantity <= 0 && $obj->area <= 0) {
                        $obj->status = 'SCRAPPED';
                    }
                    $obj->save();

                    // Log movements adjust differences
                    InventoryMovement::create([
                        'organization_id' => $count->organization_id,
                        'inventory_object_id' => $obj->id,
                        'movement_type' => 'ADJUSTMENT',
                        'quantity_delta' => $item->variance_quantity,
                        'area_delta' => $item->variance_area
                    ]);
                }
            }

            event(new InventoryCountCompleted($count));
        });
    }
}
