<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GraniteSlabDetail extends Model
{
    protected $table = 'granite_slab_details';

    protected $fillable = [
        'inventory_object_id',
        'length',
        'width',
        'thickness',
        'finish',
        'origin',
        'parent_slab_id'
    ];

    protected $casts = [
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'thickness' => 'decimal:2',
    ];

    public function inventoryObject(): BelongsTo
    {
        return $this->belongsTo(InventoryObject::class);
    }

    public function parentSlab(): BelongsTo
    {
        return $this->belongsTo(GraniteSlabDetail::class, 'parent_slab_id');
    }
}
