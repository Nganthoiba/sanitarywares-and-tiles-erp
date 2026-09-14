<?php

namespace App\Domains\Inventory\Exceptions;

class InsufficientStockException extends InventoryDomainException
{
    protected int $statusCode = 400;
}
