<?php

namespace App\Domains\Inventory\Events;

use App\Domains\Purchase\Models\GoodsReceiptNote;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(public GoodsReceiptNote $grn) {}
}
