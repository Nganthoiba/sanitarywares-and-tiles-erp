<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_order_id' => $this->purchase_order_id,
            'product_variant_id' => $this->product_variant_id,
            'product_variant_name' => $this->variant->name ?? null,
            'product_variant_sku' => $this->variant->sku ?? null,
            'product_behavior' => $this->variant->inventory_behavior ?? null,
            'quantity' => (float) $this->quantity,
            'received_quantity' => (float) $this->received_quantity,
            'remaining_quantity' => max(0.0, (float) $this->quantity - (float) $this->received_quantity),
            'unit_id' => $this->unit_id,
            'unit_name' => $this->unit->name ?? null,
            'unit_symbol' => $this->unit->symbol ?? null,
            'pricing_unit_id' => $this->pricing_unit_id,
            'pricing_unit_name' => $this->pricingUnit->name ?? null,
            'pricing_unit_symbol' => $this->pricingUnit->symbol ?? null,
            'estimated_pricing_quantity' => (float) $this->estimated_pricing_quantity,
            'received_pricing_quantity' => (float) $this->received_pricing_quantity,
            'unit_price' => (float) $this->unit_price,
            'discount_amount' => (float) $this->discount_amount,
            'tax_amount' => (float) $this->tax_amount,
            'tax_rate' => (float) $this->tax_rate,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
