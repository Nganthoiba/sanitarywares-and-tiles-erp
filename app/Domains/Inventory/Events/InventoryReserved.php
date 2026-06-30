<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Inventory\Models\InventoryReservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryReserved
{
    use Dispatchable, SerializesModels;

    public function __construct(public InventoryReservation $reservation) {}
}
