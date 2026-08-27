<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGRNRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'storage_location_id' => ['nullable', 'exists:storage_locations,id'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'batch_number' => ['required', 'string', 'max:50'],
            'received_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.purchase_order_item_id' => ['nullable', 'exists:purchase_order_items,id'],
            'items.*.unit_id' => ['nullable', 'exists:units,id'],
            'items.*.quantity_received' => ['required', 'numeric', 'gt:0'],
            'items.*.quantity_accepted' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity_rejected' => ['nullable', 'numeric', 'min:0'],
            'items.*.slabs' => ['nullable', 'array'],
            'items.*.slabs.*.length' => ['required_with:items.*.slabs', 'numeric', 'gt:0'],
            'items.*.slabs.*.width' => ['required_with:items.*.slabs', 'numeric', 'gt:0'],
            'items.*.slabs.*.thickness' => ['nullable', 'numeric', 'gt:0'],
            'items.*.slabs.*.finish' => ['nullable', 'string'],
            'items.*.slabs.*.origin' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            foreach ($items as $index => $item) {
                $variantId = $item['product_variant_id'] ?? null;
                if (!$variantId) continue;

                $variant = \App\Domains\Product\Models\Product::find($variantId);
                if (!$variant) continue;

                $hasSlabs = !empty($item['slabs']);

                if ($variant->inventory_behavior === 'SLAB') {
                    if (!$hasSlabs) {
                        $validator->errors()->add("items.{$index}.slabs", "Granite slabs are required for slab product variant: {$variant->name}.");
                    } else {
                        $qty = (float) ($item['quantity_received'] ?? 0);
                        $slabCount = count($item['slabs']);
                        if ($slabCount !== (int) $qty) {
                            $validator->errors()->add("items.{$index}.slabs", "Slab count ({$slabCount}) must match received quantity ({$qty}) for Granite variant: {$variant->name}.");
                        }
                    }
                } else {
                    if ($hasSlabs) {
                        $validator->errors()->add("items.{$index}.slabs", "Slabs data must not be provided for non-slab product variant: {$variant->name}.");
                    }
                }
            }
        });
    }
}
