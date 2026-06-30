<?php
namespace App\Domains\Inventory\Enums;

enum InventoryStatus: string {
    case AVAILABLE = 'AVAILABLE';
    case RESERVED = 'RESERVED';
    case ALLOCATED = 'ALLOCATED';
    case PICKED = 'PICKED';
    case DISPATCHED = 'DISPATCHED';
    case DAMAGED = 'DAMAGED';
    case RETURNED = 'RETURNED';
    case SCRAPPED = 'SCRAPPED';
}
