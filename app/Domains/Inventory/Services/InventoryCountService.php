<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryCount;
use App\Domains\Inventory\Models\InventoryCountItem;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryCountCompleted;
use App\Domains\Master\Services\DocumentNumberService;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryCountService
{
    protected DocumentNumberService $documentNumberService;
    protected AdjustmentService $adjustmentService;

    public function __construct(
        ?DocumentNumberService $documentNumberService = null,
        ?AdjustmentService $adjustmentService = null
    ) {
        $this->documentNumberService = $documentNumberService ?? new DocumentNumberService();
        $this->adjustmentService = $adjustmentService ?? new AdjustmentService();
    }

    public function initiateCount(array $data): InventoryCount
    {
        return DB::transaction(function () use ($data) {
            $orgId = $data['organization_id'] ?? 1;
            $countDate = $data['count_date'] ?? now()->toDateString();
            $countNumber = $data['count_number'] ?? $this->documentNumberService->generateNextNumber($orgId, 'CNT', $countDate);

            $count = InventoryCount::create([
                'organization_id' => $orgId,
                'warehouse_id' => $data['warehouse_id'],
                'count_number' => $countNumber,
                'count_date' => $countDate,
                'count_type' => $data['count_type'] ?? 'CYCLE', // CYCLE, ANNUAL, BLIND
                'status' => 'PENDING',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['user_id'] ?? null
            ]);

            // Auto-populate all active inventory items in that warehouse for reconciliation
            $objects = InventoryObject::where('warehouse_id', $count->warehouse_id)
                ->whereIn('status', ['AVAILABLE', 'ON_HAND'])
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

    public function updateCountQuantity(int $itemId, float $countedQty, float $countedArea = 0, ?string $reason = null): void
    {
        $item = InventoryCountItem::findOrFail($itemId);

        $item->counted_quantity = $countedQty;
        $item->variance_quantity = $countedQty - $item->recorded_quantity;

        if ($item->recorded_area > 0 || $countedArea > 0) {
            $item->counted_area = $countedArea;
            $item->variance_area = $countedArea - $item->recorded_area;
        }

        if ($reason !== null) {
            $item->reason = $reason;
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

            // Resolve variances via Adjustment Movement instead of direct stock overwrite
            $varianceItems = [];
            foreach ($count->items as $item) {
                if ((float)$item->variance_quantity != 0 || (float)$item->variance_area != 0) {
                    $varianceItems[] = [
                        'inventory_object_id' => $item->inventory_object_id,
                        'quantity_delta' => (float)$item->variance_quantity,
                        'area_delta' => (float)$item->variance_area,
                        'reason' => $item->reason ?? "Stock Count Variance ({$count->count_number})"
                    ];
                }
            }

            if (!empty($varianceItems)) {
                $adjustment = $this->adjustmentService->initiateAdjustment([
                    'organization_id' => $count->organization_id,
                    'warehouse_id' => $count->warehouse_id,
                    'adjustment_date' => $count->count_date,
                    'adjustment_type' => 'ADJUSTMENT',
                    'reason' => $count->remarks ?? "Reconciliation for Stock Count {$count->count_number}",
                    'user_id' => $approverId,
                    'items' => $varianceItems,
                ]);

                $this->adjustmentService->approveAdjustment($adjustment->id, $approverId);
            }

            event(new InventoryCountCompleted($count));
        });
    }
}
