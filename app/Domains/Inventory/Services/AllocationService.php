<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryAllocation;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryAllocated;
use Exception;

class AllocationService
{
    public function allocate(array $data): InventoryAllocation
    {
        $obj = InventoryObject::findOrFail($data['inventory_object_id']);

        if ($obj->status !== 'ON_HAND' && $obj->status !== 'RESERVED') {
            throw new Exception("Inventory item is currently not available for allocation.");
        }

        $alloc = InventoryAllocation::create([
            'organization_id' => $data['organization_id'] ?? 1,
            'inventory_reservation_id' => $data['inventory_reservation_id'],
            'inventory_object_id' => $obj->id,
            'quantity' => $data['quantity'],
            'area' => $data['area'] ?? 0.0000
        ]);

        $obj->status = 'ALLOCATED';
        $obj->save();

        $res = $alloc->reservation;
        if ($res) {
            $res->status = 'FULFILLED';
            $res->save();
        }

        InventoryMovement::create([
            'organization_id' => $alloc->organization_id,
            'inventory_object_id' => $obj->id,
            'movement_type' => 'ALLOCATION',
            'quantity_delta' => -$alloc->quantity,
            'area_delta' => -$alloc->area
        ]);

        event(new InventoryAllocated($alloc));

        return $alloc;
    }

    public function release(int $allocationId): void
    {
        $alloc = InventoryAllocation::findOrFail($allocationId);

        $alloc->delete();

        $obj = $alloc->inventoryObject;
        if ($obj) {
            $obj->status = 'ON_HAND';
            $obj->save();
        }

        InventoryMovement::create([
            'organization_id' => $alloc->organization_id,
            'inventory_object_id' => $obj->id,
            'movement_type' => 'RECEIPT',
            'quantity_delta' => $alloc->quantity,
            'area_delta' => $alloc->area
        ]);
    }

    public function complete(int $allocationId): void
    {
        // Allocation is fulfilled
        $alloc = InventoryAllocation::findOrFail($allocationId);

        $obj = $alloc->inventoryObject;
        if ($obj) {
            $obj->status = 'DISPATCHED'; // physical checkout complete
            $obj->save();
        }

        InventoryMovement::create([
            'organization_id' => $alloc->organization_id,
            'inventory_object_id' => $obj?->id,
            'movement_type' => 'DISPATCH',
            'quantity_delta' => 0,
            'area_delta' => 0
        ]);
    }
}
