<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Inventory\Models\InventoryAllocation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryAllocated
{
    use Dispatchable, SerializesModels;

    public function __construct(public InventoryAllocation $allocation) {}
}
