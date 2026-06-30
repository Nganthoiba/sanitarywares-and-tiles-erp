<?php
namespace App\Domains\Purchase\Enums;

enum PurchaseOrderStatus: string {
    case DRAFT = 'DRAFT';
    case SENT = 'SENT';
    case PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
}
