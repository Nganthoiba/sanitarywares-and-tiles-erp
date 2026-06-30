<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Master\Models\Unit;

class QuotationItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'quotation_id', 'product_variant_id', 'quantity', 'unit_id', 'unit_price', 'tax_amount', 'subtotal'];
    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'subtotal' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function quotation(): BelongsTo {
        return $this->belongsTo(Quotation::class);
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
    public function unit(): BelongsTo {
        return $this->belongsTo(Unit::class);
    }
}
