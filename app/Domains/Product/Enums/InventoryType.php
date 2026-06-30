<?php
namespace App\Domains\Product\Enums;

enum InventoryType: string {
    case STANDARD = 'STANDARD';
    case CONVERTIBLE = 'CONVERTIBLE';
    case SLAB = 'SLAB';
    case SERIAL = 'SERIAL';
    case BATCH = 'BATCH';
    case BUNDLE = 'BUNDLE';
    case ROLL = 'ROLL';
}
