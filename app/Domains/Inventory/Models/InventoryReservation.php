<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\Customer;
use App\Domains\Product\Models\Product;
use App\Models\User;

class InventoryReservation extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'reservation_number',
        'source_type',
        'source_id',
        'source_item_id',
        'product_variant_id',
        'inventory_object_id',
        'warehouse_id',
        'storage_location_id',
        'customer_id',
        'created_by',
        'quantity',
        'area',
        'reservation_date',
        'expires_at',
        'reference_number',
        'remarks',
        'status'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'area' => 'decimal:4',
        'reservation_date' => 'datetime',
        'expires_at' => 'datetime',
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

    public function inventoryObject(): BelongsTo
    {
        return $this->belongsTo(InventoryObject::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function storageLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
