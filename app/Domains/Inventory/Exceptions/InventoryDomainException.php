<?php

namespace App\Domains\Inventory\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class InventoryDomainException extends Exception
{
    protected int $statusCode = 422;

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
        ], $this->statusCode);
    }
}
