<?php

namespace App\Domains\Inventory\Enums;

enum MovementType: string
{
    case PURCHASE = 'PURCHASE';
    case SALE = 'SALE';
    case RETURN = 'RETURN';
    case TRANSFER = 'TRANSFER';
    case ADJUSTMENT = 'ADJUSTMENT';
    case DAMAGE = 'DAMAGE';
    case SCRAP = 'SCRAP';
    case RESERVATION = 'RESERVATION';
    case ALLOCATION = 'ALLOCATION';
    case REALLOCATION = 'REALLOCATION';
    case DISPATCH = 'DISPATCH';
    case RECEIPT = 'RECEIPT';
}
