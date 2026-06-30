<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Inventory\Models\InventoryObject;

class SalesReturnItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'sales_return_id', 'invoice_item_id', 'inventory_object_id', 'quantity'];
    protected $casts = ['quantity' => 'decimal:4'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function salesReturn(): BelongsTo {
        return $this->belongsTo(SalesReturn::class);
    }
    public function invoiceItem(): BelongsTo {
        return $this->belongsTo(InvoiceItem::class, 'invoice_item_id');
    }
    public function inventoryObject(): BelongsTo {
        return $this->belongsTo(InventoryObject::class);
    }
}
