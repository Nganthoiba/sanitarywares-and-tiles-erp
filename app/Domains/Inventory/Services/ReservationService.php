<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryReserved;
use App\Domains\Inventory\Events\InventoryReleased;
use Exception;

class ReservationService
{
    public function reserve(array $data): InventoryReservation
    {
        $obj = InventoryObject::findOrFail($data['inventory_object_id']);

        if ($obj->status !== 'ON_HAND') {
            throw new Exception("Inventory item is currently unavailable.");
        }

        $res = InventoryReservation::create([
            'organization_id' => $data['organization_id'] ?? 1,
            'inventory_object_id' => $obj->id,
            'source_type' => $data['source_type'] ?? 'QUOTATION',
            'source_id' => $data['source_id'] ?? 1,
            'source_item_id' => $data['source_item_id'] ?? 1,
            'product_variant_id' => $obj->product_variant_id,
            'quantity' => $data['quantity'],
            'area' => $data['area'] ?? 0.0000,
            'status' => 'PENDING'
        ]);

        // Updates status
        $obj->status = 'RESERVED';
        $obj->save();

        InventoryMovement::create([
            'organization_id' => $res->organization_id,
            'inventory_object_id' => $obj->id,
            'movement_type' => 'RESERVATION',
            'quantity_delta' => -$res->quantity,
            'area_delta' => -$res->area
        ]);

        event(new InventoryReserved($res));

        return $res;
    }

    public function release(int $reservationId): void
    {
        $res = InventoryReservation::findOrFail($reservationId);
        if ($res->status !== 'PENDING') {
            throw new Exception("Reservation is already resolved.");
        }

        $res->status = 'CANCELLED';
        $res->save();

        $obj = $res->inventoryObject;
        if ($obj && $obj->status === 'RESERVED') {
            $obj->status = 'ON_HAND';
            $obj->save();
        }

        InventoryMovement::create([
            'organization_id' => $res->organization_id,
            'inventory_object_id' => $obj->id,
            'movement_type' => 'RECEIPT',
            'quantity_delta' => $res->quantity,
            'area_delta' => $res->area
        ]);

        event(new InventoryReleased($res));
    }
}
