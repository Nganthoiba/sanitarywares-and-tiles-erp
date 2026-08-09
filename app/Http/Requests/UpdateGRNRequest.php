<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGRNRequest extends FormRequest
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
}
