<?php

namespace App\Domains\Purchase\Services;

use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Enums\InventoryStatus;
use App\Domains\Inventory\Enums\InventoryMovementType;
use Illuminate\Support\Facades\DB;
use Exception;

class GRNService
{
    /**
     * Create and approve a Goods Receipt Note, automatically generating warehouse inventory.
     */
    public function receiveGoods(int $purchaseOrderId, array $receivedItems): GoodsReceiptNote
    {
        return DB::transaction(function () use ($purchaseOrderId, $receivedItems) {
            $po = PurchaseOrder::findOrFail($purchaseOrderId);

            // 1. Create the Goods Receipt Note header record
            $grn = GoodsReceiptNote::create([
                'organization_id' => $po->organization_id,
                'warehouse_id' => $receivedItems[0]['warehouse_id'] ?? null,
                'purchase_order_id' => $po->id,
                'grn_number' => 'GRN-' . uniqid(),
                'received_date' => now(),
                'status' => GoodsReceiptStatus::RECEIVED->value,
            ]);

            // 2. Process received line items and create inventory
            foreach ($receivedItems as $item) {
                $quantity = $item['quantity'] ?? 1.0;
                $area = $item['area'] ?? 0.0;
                $warehouseId = $item['warehouse_id'];
                $storageLocationId = $item['storage_location_id'] ?? null;

                // Create unique inventory objects representing physical boxes or batches in the warehouse
                $inventory = InventoryObject::create([
                    'organization_id' => $po->organization_id,
                    'product_variant_id' => $item['product_variant_id'],
                    'warehouse_id' => $warehouseId,
                    'storage_location_id' => $storageLocationId,
                    'quantity_on_hand' => $quantity,
                    'area_on_hand' => $area,
                    'batch_number' => $item['batch_number'] ?? 'BATCH-' . date('Ymd'),
                    'status' => InventoryStatus::AVAILABLE->value,
                ]);

                // Create GRN item record
                $grn->items()->create([
                    'organization_id' => $po->organization_id,
                    'purchase_order_item_id' => $item['purchase_order_item_id'] ?? 1,
                    'product_variant_id' => $item['product_variant_id'],
                    'inventory_object_id' => $inventory->id,
                    'quantity_received' => $quantity,
                    'quantity_accepted' => $quantity,
                    'quantity_rejected' => 0.0,
                ]);

                // 3. Write accounting-style inventory movements ledger item (double entry for quantity)
                InventoryMovement::create([
                    'organization_id' => $po->organization_id,
                    'inventory_object_id' => $inventory->id,
                    'warehouse_id' => $warehouseId,
                    'movement_type' => InventoryMovementType::PURCHASE->value,
                    'quantity_delta' => $quantity,
                    'area_delta' => $area,
                    'notes' => "Received from GRN Number: {$grn->grn_number}",
                ]);
            }

            // 4. Dispatch General Event
            event(new \App\Domains\Purchase\Events\GoodsReceived(
                $grn->id,
                $grn->organization_id,
                $receivedItems,
                now()->toIso8601String()
            ));

            return $grn;
        });
    }
}
