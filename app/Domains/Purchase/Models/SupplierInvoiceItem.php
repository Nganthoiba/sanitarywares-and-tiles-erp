<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;

class SupplierInvoiceItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'supplier_invoice_id', 'goods_receipt_item_id', 'product_variant_id', 'quantity', 'unit_price', 'tax_amount', 'subtotal'];
    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'subtotal' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function invoice(): BelongsTo {
        return $this->belongsTo(SupplierInvoice::class, 'supplier_invoice_id');
    }
    public function grnItem(): BelongsTo {
        return $this->belongsTo(GoodsReceiptItem::class, 'goods_receipt_item_id');
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
