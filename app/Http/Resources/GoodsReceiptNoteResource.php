<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceiptNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse->name ?? null,
            'storage_location_id' => $this->storage_location_id,
            'storage_location_name' => $this->storageLocation->name ?? null,
            'storage_location_code' => $this->storageLocation->code ?? null,
            'purchase_order_id' => $this->purchase_order_id,
            'purchase_order_number' => $this->order->po_number ?? null,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier->name ?? ($this->order->supplier->name ?? null),
            'grn_number' => $this->grn_number,
            'batch_number' => $this->batch_number,
            'received_date' => $this->received_date?->toDateString(),
            'status' => $this->status,
            'remarks' => $this->remarks,
            'items' => GoodsReceiptItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
