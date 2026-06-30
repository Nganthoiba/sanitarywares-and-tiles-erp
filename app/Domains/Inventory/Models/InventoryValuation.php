<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class InventoryValuation extends Model
{
    use BelongsToOrganization;
    protected $fillable = [
        'organization_id',
        'inventory_object_id',
        'valuation_method',
        'unit_cost',
        'total_value'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function inventoryObject(): BelongsTo
    {
        return $this->belongsTo(InventoryObject::class);
    }
}
