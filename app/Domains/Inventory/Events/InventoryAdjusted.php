<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Inventory\Models\InventoryAdjustment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryAdjusted
{
    use Dispatchable, SerializesModels;

    public function __construct(public InventoryAdjustment $adjustment) {}
}
