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
    protected StockResolverService $stockResolver;

    public function __construct(?StockResolverService $stockResolver = null)
    {
        $this->stockResolver = $stockResolver ?? new StockResolverService();
    }

    public function initiateAdjustment(array $data): InventoryAdjustment
    {
        return DB::transaction(function () use ($data) {
            $orgId = $data['organization_id'] ?? 1;
            $adjustment = InventoryAdjustment::create([
                'organization_id' => $orgId,
                'warehouse_id' => $data['warehouse_id'],
                'adjustment_number' => $data['adjustment_number'] ?? 'ADJ-' . uniqid(),
                'adjustment_date' => $data['adjustment_date'] ?? now()->toDateString(),
                'adjustment_type' => $data['adjustment_type'], // POSITIVE, NEGATIVE, DAMAGE, SCRAP
                'status' => 'PENDING',
                'reason' => $data['reason'] ?? null,
                'created_by' => $data['user_id'] ?? null
            ]);

            foreach ($data['items'] as $item) {
                if (!empty($item['inventory_object_id'])) {
                    // Specific inventory object adjustment (Slab or explicit object)
                    InventoryAdjustmentItem::create([
                        'inventory_adjustment_id' => $adjustment->id,
                        'inventory_object_id' => $item['inventory_object_id'],
                        'quantity_delta' => (float) $item['quantity_delta'],
                        'area_delta' => (float) ($item['area_delta'] ?? 0.0000)
                    ]);
                } else if (!empty($item['product_variant_id'])) {
                    // Ordinary product stock adjustment
                    $variantId = (int) $item['product_variant_id'];
                    $qtyDelta = (float) $item['quantity_delta'];
                    $areaDelta = (float) ($item['area_delta'] ?? 0.0000);

                    if ($qtyDelta < 0) {
                        // Negative adjustment: resolve stock dynamically across available objects
                        $allocations = $this->stockResolver->resolveStock(
                            $orgId,
                            $variantId,
                            $data['warehouse_id'],
                            abs($qtyDelta)
                        );

                        foreach ($allocations as $alloc) {
                            /** @var InventoryObject $sourceObj */
                            $sourceObj = $alloc['object'];
                            $takeQty = $alloc['quantity'];
                            $takeArea = $alloc['area'];

                            InventoryAdjustmentItem::create([
                                'inventory_adjustment_id' => $adjustment->id,
                                'inventory_object_id' => $sourceObj->id,
                                'quantity_delta' => -$takeQty,
                                'area_delta' => -$takeArea
                            ]);
                        }
                    } else {
                        // Positive adjustment: find or create bulk inventory object
                        $existingObj = InventoryObject::where('organization_id', $orgId)
                            ->where('product_variant_id', $variantId)
                            ->where('warehouse_id', $data['warehouse_id'])
                            ->whereIn('status', ['AVAILABLE', 'ON_HAND'])
                            ->orderBy('id', 'asc')
                            ->first();

                        if (!$existingObj) {
                            $existingObj = InventoryObject::create([
                                'organization_id' => $orgId,
                                'product_variant_id' => $variantId,
                                'warehouse_id' => $data['warehouse_id'],
                                'object_code' => 'ADJ-BULK-' . $adjustment->adjustment_number,
                                'quantity' => 0.0000,
                                'area' => 0.0000,
                                'status' => 'AVAILABLE',
                            ]);
                        }

                        InventoryAdjustmentItem::create([
                            'inventory_adjustment_id' => $adjustment->id,
                            'inventory_object_id' => $existingObj->id,
                            'quantity_delta' => $qtyDelta,
                            'area_delta' => $areaDelta
                        ]);
                    }
                } else {
                    throw new Exception("Adjustment item must specify either product_variant_id or inventory_object_id.");
                }
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
                if (!$obj) {
                    continue;
                }

                // Adjust quantities or area
                $obj->quantity = max(0, (float) $obj->quantity + (float) $item->quantity_delta);
                if ((float) $obj->area > 0 || (float) $item->area_delta != 0) {
                    $obj->area = max(0, (float) $obj->area + (float) $item->area_delta);
                }

                if ($obj->quantity <= 0 && $obj->area <= 0) {
                    $obj->status = 'SCRAPPED';
                } else if ($obj->status === 'SCRAPPED' && $obj->quantity > 0) {
                    $obj->status = 'AVAILABLE';
                }
                $obj->save();

                InventoryMovement::create([
                    'organization_id' => $adj->organization_id,
                    'inventory_object_id' => $obj->id,
                    'movement_type' => $adj->adjustment_type,
                    'quantity_delta' => (float) $item->quantity_delta,
                    'area_delta' => (float) $item->area_delta,
                    'from_warehouse_id' => $adj->warehouse_id,
                    'to_warehouse_id' => $adj->warehouse_id,
                ]);
            }

            // Post Accounting Journal Entry for Stock Adjustment
            $postingService = app(\App\Domains\Accounting\Services\PostingService::class);
            $totalAdjustmentValue = 0.0;
            $isLoss = in_array(strtoupper($adj->adjustment_type), ['DAMAGE', 'SCRAP', 'NEGATIVE', 'THEFT', 'LOSS']);

            foreach ($adj->items as $item) {
                $unitCost = (float) ($item->inventoryObject?->variant?->cost_price ?? 100.0);
                $totalAdjustmentValue += abs((float) $item->quantity_delta) * $unitCost;
            }

            if ($totalAdjustmentValue > 0) {
                $inventoryAccountId = $postingService->resolveOrCreateAccount(
                    $adj->organization_id,
                    'INV-01',
                    'Inventory Asset A/c',
                    'ASSET',
                    'Current Assets'
                )->id;

                $adjAccCode = $isLoss ? 'EXP-ADJ-LOSS-01' : 'REV-ADJ-GAIN-01';
                $adjAccName = $isLoss ? 'Inventory Adjustment Loss A/c' : 'Inventory Adjustment Gain A/c';
                $adjGroupType = $isLoss ? 'EXPENSE' : 'INCOME';
                $adjGroupName = $isLoss ? 'Direct Expenses' : 'Direct Income';

                $adjustmentAccountId = $postingService->resolveOrCreateAccount(
                    $adj->organization_id,
                    $adjAccCode,
                    $adjAccName,
                    $adjGroupType,
                    $adjGroupName
                )->id;

                $postingService->postInventoryAdjustment(
                    $adj->organization_id,
                    $totalAdjustmentValue,
                    $isLoss,
                    $inventoryAccountId,
                    $adjustmentAccountId,
                    $adj->reason ?? "Stock Adjustment {$adj->adjustment_number}",
                    $adj->adjustment_date ?? now()->toDateString(),
                    $adj->id
                );
            }

            event(new InventoryAdjusted($adj));
        });
    }
}
