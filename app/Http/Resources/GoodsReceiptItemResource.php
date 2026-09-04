<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceiptItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'goods_receipt_note_id' => $this->goods_receipt_note_id,
            'purchase_order_item_id' => $this->purchase_order_item_id,
            'product_variant_id' => $this->product_variant_id,
            'variant_name' => $this->variant->name ?? null,
            'variant_sku' => $this->variant->sku ?? null,
            'inventory_behavior' => $this->variant->inventory_behavior ?? 'STANDARD',
            'unit_id' => $this->unit_id,
            'unit_symbol' => $this->unit->symbol ?? null,
            'inventory_object_id' => $this->inventory_object_id,
            'quantity_received' => (float) $this->quantity_received,
            'quantity_accepted' => (float) $this->quantity_accepted,
            'quantity_rejected' => (float) $this->quantity_rejected,
            'unit_price' => $this->unit_price !== null ? (float) $this->unit_price : null,
            'batch_number' => $this->batch_number,
            'slabs' => GoodsReceiptItemSlabResource::collection($this->whenLoaded('slabs')),
        ];
    }
}
