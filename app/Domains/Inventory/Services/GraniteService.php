<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Actions\CutGraniteSlabAction;
use App\Domains\Inventory\Events\GraniteSlabCreated;
use App\Domains\Inventory\Enums\InventoryBehavior;

class GraniteService
{
    public function __construct(
        protected CutGraniteSlabAction $cutAction
    ) {}

    public function createSlab(array $data): InventoryObject
    {
        $slab = InventoryObject::create([
            'organization_id' => $data['organization_id'] ?? 1,
            'warehouse_id' => $data['warehouse_id'],
            'product_variant_id' => $data['product_variant_id'],
            'status' => 'ON_HAND',
            'object_code' => $data['slab_code'],
            'quantity' => 1.0000,
            'area' => $data['area'] ?? (($data['length'] * $data['width']) / 144.0)
        ]);

        \App\Domains\Inventory\Models\GraniteSlabDetail::create([
            'inventory_object_id' => $slab->id,
            'length' => $data['length'],
            'width' => $data['width'],
            'thickness' => $data['thickness'] ?? 20.00,
            'finish' => $data['finish'] ?? 'POLISHED',
            'origin' => $data['origin'] ?? 'IMPORT'
        ]);

        event(new GraniteSlabCreated($slab));

        return $slab;
    }

    public function cutSlab(int $slabId, array $cuts): array
    {
        return $this->cutAction->execute($slabId, $cuts);
    }

    public function splitSlab(int $slabId, array $splits): array
    {
        $formattedCuts = [];
        foreach ($splits as $split) {
            $formattedCuts[] = [
                'length' => $split['length'] ?? 0,
                'width' => $split['width'] ?? 0,
                'area' => $split['area'] ?? 0
            ];
        }
        return $this->cutAction->execute($slabId, $formattedCuts);
    }
}
