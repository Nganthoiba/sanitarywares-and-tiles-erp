<?php

namespace App\Domains\Product\Models;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Traits\BelongsToOrganization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationProductPricing extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;

    protected $table = 'organization_product_pricings';

    protected $fillable = [
        'organization_id',
        'product_variant_id',
        'cost_price',
        'selling_price',
        'price_basis',
        'price_basis_unit_id',
        'pieces_per_box',
        'package_weight_kg',
        'effective_from',
        'effective_to',
        'is_current',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'selling_price' => 'decimal:4',
        'pieces_per_box' => 'integer',
        'package_weight_kg' => 'decimal:2',
        'is_current' => 'boolean',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }

    public function priceBasisUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'price_basis_unit_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function calculateCostPerBox(): ?float
    {
        if ($this->cost_price && $this->pieces_per_box && $this->pieces_per_box > 0) {
            return (float) ($this->cost_price * $this->pieces_per_box);
        }
        return null;
    }

    public function calculateSellingPerBox(): ?float
    {
        if ($this->selling_price && $this->pieces_per_box && $this->pieces_per_box > 0) {
            return (float) ($this->selling_price * $this->pieces_per_box);
        }
        return null;
    }
}
