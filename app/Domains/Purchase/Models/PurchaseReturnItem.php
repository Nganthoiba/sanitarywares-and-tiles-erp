<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Inventory\Models\InventoryObject;

class PurchaseReturnItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'purchase_return_id', 'supplier_invoice_item_id', 'inventory_object_id', 'quantity'];
    protected $casts = ['quantity' => 'decimal:4'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function purchaseReturn(): BelongsTo {
        return $this->belongsTo(PurchaseReturn::class, 'purchase_return_id');
    }
    public function invoiceItem(): BelongsTo {
        return $this->belongsTo(SupplierInvoiceItem::class, 'supplier_invoice_item_id');
    }
    public function inventoryObject(): BelongsTo {
        return $this->belongsTo(InventoryObject::class);
    }
}
