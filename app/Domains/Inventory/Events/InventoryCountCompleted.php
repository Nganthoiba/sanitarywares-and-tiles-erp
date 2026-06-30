<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Inventory\Models\InventoryCount;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryCountCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public InventoryCount $count) {}
}
