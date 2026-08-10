<?php
namespace App\Domains\Purchase\Enums;

enum GoodsReceiptStatus: string {
    case DRAFT = 'DRAFT';
    case APPROVED = 'APPROVED';
    case LOCKED = 'LOCKED';
    case RECEIVED = 'RECEIVED';
    case INSPECTED = 'INSPECTED';
    case PUT_AWAY = 'PUT_AWAY';
}
