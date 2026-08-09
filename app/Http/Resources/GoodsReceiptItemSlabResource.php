<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceiptItemSlabResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'goods_receipt_item_id' => $this->goods_receipt_item_id,
            'length' => (float) $this->length,
            'width' => (float) $this->width,
            'thickness' => (float) $this->thickness,
            'finish' => $this->finish,
            'origin' => $this->origin,
            'slab_code' => $this->slab_code,
        ];
    }
}
