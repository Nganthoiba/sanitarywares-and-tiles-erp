<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Inventory\Models\InventoryObject;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GraniteSlabCut
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public InventoryObject $parent,
        public array $remnants
    ) {}
}
