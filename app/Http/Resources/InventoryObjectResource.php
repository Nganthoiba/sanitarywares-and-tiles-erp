<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryObjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'product_variant_id' => $this->product_variant_id,
            'variant_name' => $this->variant->name ?? null,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse->name ?? null,
            'storage_location_id' => $this->storage_location_id,
            'object_code' => $this->object_code,

            // Slab details
            'length' => $this->slabDetail ? (float) $this->slabDetail->length : null,
            'width' => $this->slabDetail ? (float) $this->slabDetail->width : null,
            'thickness' => $this->slabDetail ? (float) $this->slabDetail->thickness : null,
            'finish' => $this->slabDetail ? $this->slabDetail->finish : null,
            'origin' => $this->slabDetail ? $this->slabDetail->origin : null,

            'quantity' => (float) $this->quantity,
            'area' => (float) $this->area,
            'batch_number' => $this->batch_number,
            'serial_number' => $this->serial_number,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
