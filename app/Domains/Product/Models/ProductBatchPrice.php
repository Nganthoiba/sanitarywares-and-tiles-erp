<?php

namespace App\Domains\Product\Models;

use App\Domains\Master\Traits\BelongsToOrganization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductBatchPrice extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;

    protected $table = 'product_batch_prices';

    protected $fillable = [
        'organization_id',
        'product_variant_id',
        'batch_number',
        'cost_price',
        'sale_price',
        'user_id',
        'updated_by',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'sale_price' => 'decimal:4',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
