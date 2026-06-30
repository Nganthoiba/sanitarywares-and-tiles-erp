<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Master\Models\Unit;

class PurchaseRequisitionItem extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'purchase_requisition_id', 'product_variant_id', 'quantity', 'unit_id'];
    protected $casts = ['quantity' => 'decimal:4'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function requisition(): BelongsTo {
        return $this->belongsTo(PurchaseRequisition::class, 'purchase_requisition_id');
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
    public function unit(): BelongsTo {
        return $this->belongsTo(Unit::class);
    }
}
