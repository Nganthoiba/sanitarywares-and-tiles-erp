<?php
namespace App\Domains\Inventory\Enums;

enum InventoryMovementType: string {
    case PURCHASE = 'PURCHASE';
    case SALE = 'SALE';
    case RETURN = 'RETURN';
    case TRANSFER = 'TRANSFER';
    case ADJUSTMENT = 'ADJUSTMENT';
    case DAMAGE = 'DAMAGE';
    case ALLOCATION = 'ALLOCATION';
    case REALLOCATION = 'REALLOCATION';
}
