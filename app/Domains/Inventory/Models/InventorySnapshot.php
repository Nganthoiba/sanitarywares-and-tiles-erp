<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Product\Models\Product;

class InventorySnapshot extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'warehouse_id', 'product_variant_id', 'snapshot_date', 'quantity', 'area'];
    protected $casts = [
        'snapshot_date' => 'date',
        'quantity' => 'decimal:4',
        'area' => 'decimal:4',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo
    {
        return $this->product();
    }
}
