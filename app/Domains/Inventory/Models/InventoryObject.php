<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Product\Models\Product;

class InventoryObject extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = [
        'organization_id',
        'product_variant_id',
        'warehouse_id',
        'storage_location_id',
        'object_code',
        'quantity',
        'area',
        'batch_number',
        'serial_number',
        'status'
    ];
    protected $casts = [
        'quantity' => 'decimal:4',
        'area' => 'decimal:4',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo
    {
        return $this->product();
    }
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
    public function storageLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class);
    }
    public function slabDetail(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(GraniteSlabDetail::class);
    }
    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }
}
