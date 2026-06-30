<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryCountItem extends Model
{
    protected $fillable = [
        'inventory_count_id',
        'inventory_object_id',
        'recorded_quantity',
        'counted_quantity',
        'variance_quantity',
        'recorded_area',
        'counted_area',
        'variance_area'
    ];

    public function countHeader(): BelongsTo
    {
        return $this->belongsTo(InventoryCount::class, 'inventory_count_id');
    }

    public function inventoryObject(): BelongsTo
    {
        return $this->belongsTo(InventoryObject::class, 'inventory_object_id');
    }
}
