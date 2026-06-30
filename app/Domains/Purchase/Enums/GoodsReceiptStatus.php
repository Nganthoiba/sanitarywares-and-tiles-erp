<?php
namespace App\Domains\Purchase\Enums;

enum GoodsReceiptStatus: string {
    case RECEIVED = 'RECEIVED';
    case INSPECTED = 'INSPECTED';
    case PUT_AWAY = 'PUT_AWAY';
}
