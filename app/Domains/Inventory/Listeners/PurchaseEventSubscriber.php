<?php

namespace App\Domains\Inventory\Listeners;

use App\Domains\Purchase\Events\GoodsReceived;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;

class PurchaseEventSubscriber implements ShouldQueue
{
    /**
     * Handle incoming GoodsReceived event.
     */
    public function handleGoodsReceived(GoodsReceived $event): void
    {
        Log::info("PurchaseEventSubscriber: Received GoodsReceived event.", [
            'goods_receipt_note_id' => $event->goodsReceiptNoteId,
            'organization_id' => $event->organizationId,
            'timestamp' => $event->timestamp,
            'received_items_count' => count($event->receivedItems),
        ]);

        // Integrate downstream actions like:
        // - Push notification alerts to warehouse operators
        // - Invalidate stock count caches
        // - Populate reporting dashboards
    }

    /**
     * Register listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            GoodsReceived::class => 'handleGoodsReceived',
        ];
    }
}
