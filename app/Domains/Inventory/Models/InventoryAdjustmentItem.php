<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAdjustmentItem extends Model
{
    protected $fillable = [
        'inventory_adjustment_id',
        'inventory_object_id',
        'quantity_delta',
        'area_delta'
    ];

    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(InventoryAdjustment::class, 'inventory_adjustment_id');
    }

    public function inventoryObject(): BelongsTo
    {
        return $this->belongsTo(InventoryObject::class, 'inventory_object_id');
    }
}
