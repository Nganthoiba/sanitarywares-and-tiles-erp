<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\Product;

class InvoiceItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = [
        'organization_id', 'invoice_id', 'sales_order_item_id', 'product_variant_id',
        'unit_id', 'price_basis', 'quantity', 'unit_price', 'discount_amount',
        'taxable_amount', 'tax_rate', 'cgst_rate', 'cgst_amount', 'sgst_rate',
        'sgst_amount', 'igst_rate', 'igst_amount', 'tax_amount', 'subtotal',
        'product_name_snapshot', 'sku_snapshot', 'variant_specs_snapshot'
    ];
    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'taxable_amount' => 'decimal:4',
        'tax_rate' => 'decimal:2',
        'cgst_rate' => 'decimal:2',
        'cgst_amount' => 'decimal:4',
        'sgst_rate' => 'decimal:2',
        'sgst_amount' => 'decimal:4',
        'igst_rate' => 'decimal:2',
        'igst_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'subtotal' => 'decimal:4',
        'variant_specs_snapshot' => 'array'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function invoice(): BelongsTo {
        return $this->belongsTo(Invoice::class);
    }
    public function orderItem(): BelongsTo {
        return $this->belongsTo(SalesOrderItem::class, 'sales_order_item_id');
    }
    public function product(): BelongsTo {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo {
        return $this->product();
    }
    public function unit(): BelongsTo {
        return $this->belongsTo(\App\Domains\Master\Models\Unit::class);
    }
}
