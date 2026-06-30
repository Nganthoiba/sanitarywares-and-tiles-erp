<?php

namespace App\Domains\Inventory\Actions;

use Exception;

class ConvertTileBoxesAction
{
    /**
     * Convert count of boxes to display format: boxes + pieces.
     * E.g. 1 Box = 4 Pieces. 394 pieces = 98 boxes + 2 pieces.
     */
    public function toDisplay(int $totalPieces, int $piecesPerBox): array
    {
        if ($piecesPerBox <= 0) {
            throw new Exception("Pieces per box must be positive.");
        }

        $boxes = intdiv($totalPieces, $piecesPerBox);
        $pieces = $totalPieces % $piecesPerBox;

        return [
            'boxes' => $boxes,
            'pieces' => $pieces,
            'display' => "{$boxes} boxes + {$pieces} pieces"
        ];
    }

    /**
     * Convert boxes and pieces back to total pieces.
     */
    public function toPieces(int $boxes, int $pieces, int $piecesPerBox): int
    {
        return ($boxes * $piecesPerBox) + $pieces;
    }
}
