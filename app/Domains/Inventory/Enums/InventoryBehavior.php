<?php

namespace App\Domains\Inventory\Enums;

enum InventoryBehavior: string
{
    case STANDARD = 'STANDARD';
    case CONVERTIBLE = 'CONVERTIBLE';
    case SLAB = 'SLAB';
    case SERIAL = 'SERIAL';
    case BATCH = 'BATCH';
    case BUNDLE = 'BUNDLE';
    case ROLL = 'ROLL';
}
