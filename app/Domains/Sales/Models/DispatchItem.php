<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Inventory\Models\InventoryObject;

class DispatchItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'dispatch_id', 'sales_order_item_id', 'product_variant_id', 'unit_id', 'inventory_object_id', 'quantity'];
    protected $casts = ['quantity' => 'decimal:4'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function dispatch(): BelongsTo {
        return $this->belongsTo(Dispatch::class);
    }
    public function orderItem(): BelongsTo {
        return $this->belongsTo(SalesOrderItem::class, 'sales_order_item_id');
    }
    public function inventoryObject(): BelongsTo {
        return $this->belongsTo(InventoryObject::class);
    }
}
