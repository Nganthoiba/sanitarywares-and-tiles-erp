<?php
namespace App\Domains\Sales\Enums;

enum InvoiceStatus: string {
    case UNPAID = 'UNPAID';
    case PARTIALLY_PAID = 'PARTIALLY_PAID';
    case PAID = 'PAID';
    case CANCELLED = 'CANCELLED';
}
