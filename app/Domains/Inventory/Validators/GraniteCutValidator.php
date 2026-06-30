<?php

namespace App\Domains\Inventory\Validators;

use App\Domains\Inventory\Models\InventoryObject;
use Exception;

class GraniteCutValidator
{
    /**
     * Validate physical constraints of cutting a granite slab.
     */
    public static function validate(InventoryObject $parent, array $cuts): void
    {
        if ($parent->status !== 'ON_HAND') {
            throw new Exception("Parent slab must be ON_HAND to be cut.");
        }

        foreach ($cuts as $idx => $cut) {
            $length = $cut['length'] ?? 0;
            $width = $cut['width'] ?? 0;
            $area = $cut['area'] ?? 0;

            if ($length <= 0 || $width <= 0 || $area <= 0) {
                throw new Exception("Cut #" . ($idx + 1) . " dimensions and area must be positive numbers.");
            }
        }

        $totalCutArea = array_sum(array_column($cuts, 'area'));
        if ($totalCutArea > $parent->area) {
            throw new Exception("Requested total cut area ({$totalCutArea} SQFT) exceeds parent available area ({$parent->area} SQFT).");
        }
    }
}
