<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;

class InvoiceItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'invoice_id', 'sales_order_item_id', 'product_variant_id', 'quantity', 'unit_price', 'tax_amount', 'subtotal'];
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
        return $this->belongsTo(Invoice::class);
    }
    public function orderItem(): BelongsTo {
        return $this->belongsTo(SalesOrderItem::class, 'sales_order_item_id');
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
