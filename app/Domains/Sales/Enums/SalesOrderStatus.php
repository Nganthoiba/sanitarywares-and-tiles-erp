<?php
namespace App\Domains\Sales\Enums;

enum SalesOrderStatus: string {
    case DRAFT = 'DRAFT';
    case APPROVED = 'APPROVED';
    case PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
}
