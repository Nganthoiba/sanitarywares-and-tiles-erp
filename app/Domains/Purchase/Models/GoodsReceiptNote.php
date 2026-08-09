<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;

class GoodsReceiptNote extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'warehouse_id', 'storage_location_id', 'purchase_order_id', 'supplier_id', 'grn_number', 'received_date', 'status', 'remarks'];
    protected $casts = ['received_date' => 'date'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function warehouse(): BelongsTo {
        return $this->belongsTo(Warehouse::class);
    }
    public function storageLocation(): BelongsTo {
        return $this->belongsTo(\App\Domains\Master\Models\StorageLocation::class, 'storage_location_id');
    }
    public function supplier(): BelongsTo {
        return $this->belongsTo(\App\Domains\Master\Models\Supplier::class, 'supplier_id');
    }
    public function order(): BelongsTo {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }
    public function items(): HasMany {
        return $this->hasMany(GoodsReceiptItem::class);
    }
}
