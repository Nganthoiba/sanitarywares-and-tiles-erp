<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Inventory\Models\InventoryObject;

class GoodsReceiptItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'goods_receipt_note_id', 'purchase_order_item_id', 'product_variant_id', 'inventory_object_id', 'quantity_received', 'quantity_accepted', 'quantity_rejected'];
    protected $casts = [
        'quantity_received' => 'decimal:4',
        'quantity_accepted' => 'decimal:4',
        'quantity_rejected' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function grn(): BelongsTo {
        return $this->belongsTo(GoodsReceiptNote::class, 'goods_receipt_note_id');
    }
    public function orderItem(): BelongsTo {
        return $this->belongsTo(PurchaseOrderItem::class, 'purchase_order_item_id');
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
    public function inventoryObject(): BelongsTo {
        return $this->belongsTo(InventoryObject::class);
    }
}
