<?php

namespace App\Domains\Inventory\Actions;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\GraniteSlabCut;
use App\Domains\Inventory\Validators\GraniteCutValidator;
use App\Domains\Inventory\Models\GraniteSlabDetail;
use Exception;

class CutGraniteSlabAction
{
    public function execute(int $slabId, array $cuts): array
    {
        $parent = InventoryObject::findOrFail($slabId);

        GraniteCutValidator::validate($parent, $cuts);

        $totalCutArea = array_sum(array_column($cuts, 'area'));
        $remnants = [];
        foreach ($cuts as $index => $cut) {
            $remnant = InventoryObject::create([
                'organization_id' => $parent->organization_id,
                'warehouse_id' => $parent->warehouse_id,
                'product_variant_id' => $parent->product_variant_id,
                'status' => 'ON_HAND',
                'object_code' => $parent->object_code . '-R' . ($index + 1),
                'quantity' => 1.0000,
                'area' => $cut['area'],
            ]);

            GraniteSlabDetail::create([
                'inventory_object_id' => $remnant->id,
                'length' => $cut['length'] ?? 0,
                'width' => $cut['width'] ?? 0,
                'thickness' => $parent->slabDetail ? $parent->slabDetail->thickness : 20.00,
                'finish' => $parent->slabDetail ? $parent->slabDetail->finish : 'POLISHED',
                'origin' => $parent->slabDetail ? $parent->slabDetail->origin : 'IMPORT',
                'parent_slab_id' => $parent->slabDetail ? $parent->slabDetail->id : null,
            ]);

            InventoryMovement::create([
                'organization_id' => $parent->organization_id,
                'inventory_object_id' => $remnant->id,
                'movement_type' => 'RECEIPT',
                'quantity_delta' => 1,
                'area_delta' => $cut['area']
            ]);

            $remnants[] = $remnant;
        }

        // Deduct parent area or mark status
        $parent->area -= $totalCutArea;
        if ($parent->area <= 0.01) {
            $parent->status = 'CUT';
            $parent->area = 0;
        }
        $parent->save();

        InventoryMovement::create([
            'organization_id' => $parent->organization_id,
            'inventory_object_id' => $parent->id,
            'movement_type' => 'ADJUSTMENT',
            'quantity_delta' => $parent->status === 'CUT' ? -1 : 0,
            'area_delta' => -$totalCutArea
        ]);

        event(new GraniteSlabCut($parent, $remnants));

        return [
            'parent' => $parent,
            'remnants' => $remnants
        ];
    }
}
