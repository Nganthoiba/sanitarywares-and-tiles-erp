<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\Product;
use App\Domains\Master\Models\Unit;

class SalesOrderItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = [
        'organization_id', 'sales_order_id', 'product_variant_id', 'quantity', 
        'allocated_quantity', 'dispatched_quantity', 'unit_id', 'unit_price', 'tax_amount', 'subtotal'
    ];
    protected $casts = [
        'quantity' => 'decimal:4',
        'allocated_quantity' => 'decimal:4',
        'dispatched_quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'subtotal' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function order(): BelongsTo {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
    public function product(): BelongsTo {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo {
        return $this->product();
    }
    public function unit(): BelongsTo {
        return $this->belongsTo(Unit::class);
    }
}
