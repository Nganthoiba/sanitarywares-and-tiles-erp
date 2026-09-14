<?php

namespace App\Domains\Inventory\Exceptions;

class InvalidReservationException extends InventoryDomainException
{
    protected int $statusCode = 422;
}
