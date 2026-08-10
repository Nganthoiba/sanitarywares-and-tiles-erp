<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch->name ?? null,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier->name ?? null,
            'purchase_requisition_id' => $this->purchase_requisition_id,
            'purchase_requisition_number' => $this->requisition->pr_number ?? null,
            'po_number' => $this->po_number,
            'po_date' => $this->po_date?->toDateString(),
            'expected_delivery_date' => $this->expected_delivery_date?->toDateString(),
            'reference_number' => $this->reference_number,
            'payment_terms' => $this->payment_terms,
            'delivery_terms' => $this->delivery_terms,
            'total_amount' => (float) $this->total_amount,
            'discount_amount' => (float) $this->discount_amount,
            'tax_amount' => (float) $this->tax_amount,
            'status' => $this->status,
            'remarks' => $this->remarks,
            'items' => PurchaseOrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
