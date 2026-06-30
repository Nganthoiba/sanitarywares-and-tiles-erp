<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Inventory\Models\InventoryReservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryReleased
{
    use Dispatchable, SerializesModels;

    public function __construct(public InventoryReservation $reservation) {}
}
