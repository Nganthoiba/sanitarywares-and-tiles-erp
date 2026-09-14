<?php

namespace App\Domains\Inventory\Exceptions;

class ReservationConflictException extends InventoryDomainException
{
    protected int $statusCode = 409;
}
