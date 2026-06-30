<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryAdjustment;
use App\Domains\Inventory\Models\InventoryAdjustmentItem;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryAdjusted;
use Illuminate\Support\Facades\DB;
use Exception;

class AdjustmentService
{
    public function initiateAdjustment(array $data): InventoryAdjustment
    {
        return DB::transaction(function () use ($data) {
            $adjustment = InventoryAdjustment::create([
                'organization_id' => $data['organization_id'] ?? 1,
                'warehouse_id' => $data['warehouse_id'],
                'adjustment_number' => $data['adjustment_number'] ?? 'ADJ-' . uniqid(),
                'adjustment_date' => $data['adjustment_date'] ?? now()->toDateString(),
                'adjustment_type' => $data['adjustment_type'], // POSITIVE, NEGATIVE, DAMAGE, SCRAP
                'status' => 'PENDING',
                'reason' => $data['reason'] ?? null,
                'created_by' => $data['user_id'] ?? null
            ]);

            foreach ($data['items'] as $item) {
                InventoryAdjustmentItem::create([
                    'inventory_adjustment_id' => $adjustment->id,
                    'inventory_object_id' => $item['inventory_object_id'],
                    'quantity_delta' => $item['quantity_delta'],
                    'area_delta' => $item['area_delta'] ?? 0.0000
                ]);
            }

            return $adjustment;
        });
    }

    public function approveAdjustment(int $adjustmentId, int $approverId): void
    {
        DB::transaction(function () use ($adjustmentId, $approverId) {
            $adj = InventoryAdjustment::findOrFail($adjustmentId);
            if ($adj->status !== 'PENDING') {
                throw new Exception("Adjustment is not pending approval.");
            }

            $adj->status = 'APPROVED';
            $adj->approved_by = $approverId;
            $adj->save();

            foreach ($adj->items as $item) {
                $obj = $item->inventoryObject;

                // Adjust quantities or area
                $obj->quantity = max(0, $obj->quantity + $item->quantity_delta);
                if ($obj->area > 0) {
                    $obj->area = max(0, $obj->area + $item->area_delta);
                }

                if ($obj->quantity <= 0 && $obj->area <= 0) {
                    $obj->status = 'SCRAPPED';
                }
                $obj->save();

                InventoryMovement::create([
                    'organization_id' => $adj->organization_id,
                    'inventory_object_id' => $obj->id,
                    'movement_type' => $adj->adjustment_type,
                    'quantity_delta' => $item->quantity_delta,
                    'area_delta' => $item->area_delta
                ]);
            }

            event(new InventoryAdjusted($adj));
        });
    }
}
