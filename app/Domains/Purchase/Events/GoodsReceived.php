<?php

namespace App\Domains\Purchase\Events;

use App\Domains\Purchase\Models\GoodsReceiptNote;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GoodsReceived
{
    use Dispatchable, SerializesModels;

    /**
     * Set up immutable event state.
     */
    public function __construct(
        public readonly int $goodsReceiptNoteId,
        public readonly int $organizationId,
        public readonly array $receivedItems,
        public readonly string $timestamp
    ) {}
}
