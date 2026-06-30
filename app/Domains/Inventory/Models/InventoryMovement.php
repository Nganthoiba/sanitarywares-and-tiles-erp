<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Models\User;

class InventoryMovement extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;

    public static function boot(): void
    {
        parent::boot();
        static::updating(function ($model) {
            throw new \Exception("Cannot update append-only model record of type " . get_class($model));
        });
        static::deleting(function ($model) {
            throw new \Exception("Cannot delete append-only model record of type " . get_class($model));
        });
    }

    protected $fillable = [
        'organization_id',
        'inventory_object_id',
        'movement_type',
        'quantity_delta',
        'area_delta',
        'from_warehouse_id',
        'to_warehouse_id',
        'from_storage_location_id',
        'to_storage_location_id',
        'reference_type',
        'reference_id',
        'user_id'
    ];
    protected $casts = [
        'quantity_delta' => 'decimal:4',
        'area_delta' => 'decimal:4',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
    public function inventoryObject(): BelongsTo
    {
        return $this->belongsTo(InventoryObject::class);
    }
    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }
    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }
    public function fromStorageLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class, 'from_storage_location_id');
    }
    public function toStorageLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class, 'to_storage_location_id');
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
