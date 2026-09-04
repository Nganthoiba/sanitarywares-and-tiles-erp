<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;

class GoodsReceiptItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'goods_receipt_note_id', 'purchase_order_item_id', 'product_variant_id', 'unit_id', 'inventory_object_id', 'quantity_received', 'quantity_accepted', 'quantity_rejected', 'unit_price', 'batch_number', 'received_pricing_quantity'];
    protected $casts = [
        'quantity_received' => 'decimal:4',
        'quantity_accepted' => 'decimal:4',
        'quantity_rejected' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'received_pricing_quantity' => 'decimal:4'
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
    public function product(): BelongsTo {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo {
        return $this->product();
    }
    public function unit(): BelongsTo {
        return $this->belongsTo(\App\Domains\Master\Models\Unit::class, 'unit_id');
    }
    public function slabs(): HasMany {
        return $this->hasMany(GoodsReceiptItemSlab::class, 'goods_receipt_item_id');
    }
    public function inventoryObject(): BelongsTo {
        return $this->belongsTo(InventoryObject::class);
    }
}
