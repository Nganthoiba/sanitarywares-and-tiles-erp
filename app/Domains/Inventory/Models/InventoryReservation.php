<?php
namespace App\Domains\Inventory\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductVariant;

class InventoryReservation extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = [
        'organization_id', 'source_type', 'source_id', 'source_item_id',
        'product_variant_id', 'inventory_object_id', 'quantity', 'area', 'status'
    ];
    protected $casts = [
        'quantity' => 'decimal:4',
        'area' => 'decimal:4',
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function variant(): BelongsTo {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
    public function inventoryObject(): BelongsTo {
        return $this->belongsTo(InventoryObject::class);
    }
}
