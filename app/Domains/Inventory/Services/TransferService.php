<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryTransfer;
use App\Domains\Inventory\Models\InventoryTransferItem;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryTransferred;
use Illuminate\Support\Facades\DB;
use Exception;

class TransferService
{
    public function initiateTransfer(array $data): InventoryTransfer
    {
        return DB::transaction(function () use ($data) {
            $transfer = InventoryTransfer::create([
                'organization_id' => $data['organization_id'] ?? 1,
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'transfer_number' => $data['transfer_number'] ?? 'TRF-' . uniqid(),
                'transfer_date' => $data['transfer_date'] ?? now()->toDateString(),
                'status' => 'PENDING',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['user_id'] ?? null
            ]);

            foreach ($data['items'] as $item) {
                $obj = InventoryObject::findOrFail($item['inventory_object_id']);

                if ($obj->warehouse_id !== $transfer->from_warehouse_id) {
                    throw new Exception("Inventory item is not in the source warehouse.");
                }

                if ($obj->status !== 'ON_HAND') {
                    throw new Exception("Inventory item is currently not available for transfer.");
                }

                InventoryTransferItem::create([
                    'inventory_transfer_id' => $transfer->id,
                    'inventory_object_id' => $obj->id,
                    'quantity' => $item['quantity']
                ]);

                // Put item in-transit status
                $obj->status = 'IN_TRANSIT';
                $obj->save();

                InventoryMovement::create([
                    'organization_id' => $transfer->organization_id,
                    'inventory_object_id' => $obj->id,
                    'movement_type' => 'TRANSFER',
                    'quantity_delta' => -$item['quantity'],
                    'area_delta' => $obj->area > 0 ? -$obj->area : 0
                ]);
            }

            return $transfer;
        });
    }

    public function completeTransfer(int $transferId): void
    {
        DB::transaction(function () use ($transferId) {
            $transfer = InventoryTransfer::findOrFail($transferId);
            if ($transfer->status !== 'PENDING') {
                throw new Exception("Transfer is already resolved.");
            }

            $transfer->status = 'RECEIVED';
            $transfer->save();

            foreach ($transfer->items as $item) {
                $obj = $item->inventoryObject;
                $obj->warehouse_id = $transfer->to_warehouse_id;
                $obj->status = 'ON_HAND';
                $obj->save();

                InventoryMovement::create([
                    'organization_id' => $transfer->organization_id,
                    'inventory_object_id' => $obj->id,
                    'movement_type' => 'RECEIPT',
                    'quantity_delta' => $item->quantity,
                    'area_delta' => $obj->area > 0 ? $obj->area : 0
                ]);
            }

            event(new InventoryTransferred($transfer));
        });
    }
}
