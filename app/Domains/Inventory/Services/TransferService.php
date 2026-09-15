<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryTransfer;
use App\Domains\Inventory\Models\InventoryTransferItem;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryTransferred;
use App\Domains\Master\Services\DocumentNumberService;
use Illuminate\Support\Facades\DB;
use Exception;

class TransferService
{
    protected StockResolverService $stockResolver;
    protected DocumentNumberService $documentNumberService;

    public function __construct(?StockResolverService $stockResolver = null, ?DocumentNumberService $documentNumberService = null)
    {
        $this->stockResolver = $stockResolver ?? new StockResolverService();
        $this->documentNumberService = $documentNumberService ?? new DocumentNumberService();
    }

    public function initiateTransfer(array $data): InventoryTransfer
    {
        return DB::transaction(function () use ($data) {
            $orgId = $data['organization_id'] ?? 1;
            $trfDate = $data['transfer_date'] ?? now()->toDateString();
            $trfNumber = $data['transfer_number'] ?? $this->documentNumberService->generateNextNumber($orgId, 'TRF', $trfDate);

            $transfer = InventoryTransfer::create([
                'organization_id' => $orgId,
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'transfer_number' => $trfNumber,
                'transfer_date' => $trfDate,
                'status' => 'PENDING',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['user_id'] ?? null
            ]);

            foreach ($data['items'] as $item) {
                if (!empty($item['inventory_object_id'])) {
                    // Specific Inventory Object (e.g. Granite/Marble Slab or explicit batch)
                    $obj = InventoryObject::findOrFail($item['inventory_object_id']);

                    if ($obj->warehouse_id !== $transfer->from_warehouse_id) {
                        throw new Exception("Inventory item #{$obj->id} is not in the source warehouse.");
                    }

                    if (!in_array($obj->status, ['AVAILABLE', 'ON_HAND'])) {
                        throw new Exception("Inventory item #{$obj->id} is currently not available for transfer.");
                    }

                    $transferQty = (float) ($item['quantity'] ?? $obj->quantity);

                    if ($transferQty >= (float) $obj->quantity) {
                        // Full transfer of specific object
                        $obj->status = 'IN_TRANSIT';
                        $obj->save();
                        $targetObj = $obj;
                    } else {
                        // Partial transfer from specific bulk object: deduct from source, create in-transit target
                        $obj->quantity = (float) $obj->quantity - $transferQty;
                        $areaRatio = $obj->quantity > 0 ? ((float) $obj->area / ($obj->quantity + $transferQty)) : 0.0;
                        $transferArea = $transferQty * $areaRatio;
                        $obj->area = max(0, (float) $obj->area - $transferArea);
                        $obj->save();

                        $targetObj = InventoryObject::create([
                            'organization_id' => $orgId,
                            'product_variant_id' => $obj->product_variant_id,
                            'warehouse_id' => $transfer->from_warehouse_id,
                            'storage_location_id' => $obj->storage_location_id,
                            'object_code' => 'TRF-' . $transfer->transfer_number . '-' . $obj->id,
                            'quantity' => $transferQty,
                            'area' => $transferArea,
                            'batch_number' => $obj->batch_number,
                            'status' => 'IN_TRANSIT',
                        ]);
                    }

                    InventoryTransferItem::create([
                        'inventory_transfer_id' => $transfer->id,
                        'inventory_object_id' => $targetObj->id,
                        'quantity' => $transferQty
                    ]);

                    InventoryMovement::create([
                        'organization_id' => $transfer->organization_id,
                        'inventory_object_id' => $targetObj->id,
                        'movement_type' => 'TRANSFER',
                        'quantity_delta' => -$transferQty,
                        'area_delta' => $targetObj->area > 0 ? -$targetObj->area : 0,
                        'from_warehouse_id' => $transfer->from_warehouse_id,
                        'to_warehouse_id' => $transfer->to_warehouse_id,
                    ]);
                } else if (!empty($item['product_variant_id'])) {
                    // Ordinary Product Stock Transfer (resolved dynamically by StockResolverService)
                    $variantId = (int) $item['product_variant_id'];
                    $transferQty = (float) $item['quantity'];

                    $allocations = $this->stockResolver->resolveStock(
                        $orgId,
                        $variantId,
                        $transfer->from_warehouse_id,
                        $transferQty,
                        $item['unit_id'] ?? null
                    );

                    foreach ($allocations as $alloc) {
                        /** @var InventoryObject $sourceObj */
                        $sourceObj = $alloc['object'];
                        $takeQty = $alloc['quantity'];
                        $takeArea = $alloc['area'];

                        // Deduct from source object
                        $sourceObj->quantity = (float) $sourceObj->quantity - $takeQty;
                        $sourceObj->area = max(0, (float) $sourceObj->area - $takeArea);
                        if ($sourceObj->quantity <= 0) {
                            $sourceObj->status = 'TRANSFERRED';
                        }
                        $sourceObj->save();

                        // Create in-transit object representing transferred quantity
                        $targetObj = InventoryObject::create([
                            'organization_id' => $orgId,
                            'product_variant_id' => $variantId,
                            'warehouse_id' => $transfer->from_warehouse_id,
                            'storage_location_id' => $sourceObj->storage_location_id,
                            'object_code' => 'TRF-' . $transfer->transfer_number . '-' . $sourceObj->id,
                            'quantity' => $takeQty,
                            'area' => $takeArea,
                            'batch_number' => $sourceObj->batch_number,
                            'status' => 'IN_TRANSIT',
                        ]);

                        InventoryTransferItem::create([
                            'inventory_transfer_id' => $transfer->id,
                            'inventory_object_id' => $targetObj->id,
                            'quantity' => $takeQty
                        ]);

                        InventoryMovement::create([
                            'organization_id' => $transfer->organization_id,
                            'inventory_object_id' => $targetObj->id,
                            'movement_type' => 'TRANSFER',
                            'quantity_delta' => -$takeQty,
                            'area_delta' => -$takeArea,
                            'from_warehouse_id' => $transfer->from_warehouse_id,
                            'to_warehouse_id' => $transfer->to_warehouse_id,
                        ]);
                    }
                } else {
                    throw new Exception("Transfer item must specify either product_variant_id or inventory_object_id.");
                }
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
                if (!$obj) {
                    continue;
                }

                // Move object to destination warehouse and make available
                $obj->warehouse_id = $transfer->to_warehouse_id;
                $obj->status = 'AVAILABLE';
                $obj->save();

                InventoryMovement::create([
                    'organization_id' => $transfer->organization_id,
                    'inventory_object_id' => $obj->id,
                    'movement_type' => 'RECEIPT',
                    'quantity_delta' => (float) $item->quantity,
                    'area_delta' => $obj->area > 0 ? (float) $obj->area : 0,
                    'from_warehouse_id' => $transfer->from_warehouse_id,
                    'to_warehouse_id' => $transfer->to_warehouse_id,
                ]);
            }

            event(new InventoryTransferred($transfer));
        });
    }
}
