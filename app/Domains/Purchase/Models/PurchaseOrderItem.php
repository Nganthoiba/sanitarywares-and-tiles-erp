<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Master\Models\Unit;

class PurchaseOrderItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = [
        'organization_id', 'purchase_order_id', 'product_variant_id',
        'quantity', 'received_quantity', 'unit_id', 'unit_price',
        'discount_amount', 'tax_amount', 'tax_rate', 'subtotal',
        'pricing_unit_id', 'estimated_pricing_quantity', 'received_pricing_quantity',
        'pricing_conversion_factor'
    ];
    protected $casts = [
        'quantity' => 'decimal:4',
        'received_quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'tax_rate' => 'decimal:4',
        'subtotal' => 'decimal:4',
        'estimated_pricing_quantity' => 'decimal:4',
        'received_pricing_quantity' => 'decimal:4',
        'pricing_conversion_factor' => 'decimal:6'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function order(): BelongsTo {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
    public function unit(): BelongsTo {
        return $this->belongsTo(Unit::class);
    }
    public function pricingUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'pricing_unit_id');
    }
}
