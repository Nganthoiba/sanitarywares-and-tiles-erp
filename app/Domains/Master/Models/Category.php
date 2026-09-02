<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = [
        'organization_id',
        'parent_id',
        'name',
        'description',
        'sort_order',
        'is_active',
        'slug',
        'default_base_unit_id',
        'default_purchase_unit_id',
        'default_sales_unit_id'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function parent(): BelongsTo {
        return $this->belongsTo(Category::class, 'parent_id');
    }
    public function children(): HasMany {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function defaultBaseUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'default_base_unit_id');
    }

    public function defaultPurchaseUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'default_purchase_unit_id');
    }

    public function defaultSalesUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'default_sales_unit_id');
    }

    /**
     * Resolve default units for this category or from root parent category.
     */
    public function getResolvedDefaultUnits(): array
    {
        $base = $this->default_base_unit_id;
        $purchase = $this->default_purchase_unit_id;
        $sales = $this->default_sales_unit_id;

        if ((!$base || !$purchase || !$sales) && $this->parent) {
            $parentDefaults = $this->parent->getResolvedDefaultUnits();
            $base = $base ?? $parentDefaults['base_unit_id'];
            $purchase = $purchase ?? $parentDefaults['purchase_unit_id'];
            $sales = $sales ?? $parentDefaults['sales_unit_id'];
        } elseif ((!$base || !$purchase || !$sales) && $this->parent_id) {
            $parentObj = static::with(['defaultBaseUnit', 'defaultPurchaseUnit', 'defaultSalesUnit'])->find($this->parent_id);
            if ($parentObj) {
                $parentDefaults = $parentObj->getResolvedDefaultUnits();
                $base = $base ?? $parentDefaults['base_unit_id'];
                $purchase = $purchase ?? $parentDefaults['purchase_unit_id'];
                $sales = $sales ?? $parentDefaults['sales_unit_id'];
            }
        }

        return [
            'base_unit_id' => $base,
            'purchase_unit_id' => $purchase,
            'sales_unit_id' => $sales,
        ];
    }

    public function productAttributes(): \Illuminate\Database\Eloquent\Relations\BelongsToMany {
        return $this->belongsToMany(\App\Domains\Product\Models\ProductAttribute::class, 'category_product_attributes')
            ->withPivot(['is_required', 'sort_order', 'allowed_values'])
            ->withTimestamps()
            ->orderBy('category_product_attributes.sort_order');
    }

    public function isTileCategory(): bool
    {
        $name = strtolower($this->name ?? '');
        $slug = strtolower($this->slug ?? '');
        if ($slug === 'tiles' || $name === 'tiles') {
            return true;
        }
        if ($this->parent) {
            return $this->parent->isTileCategory();
        }
        if ($this->parent_id) {
            $parentObj = static::find($this->parent_id);
            if ($parentObj) {
                return $parentObj->isTileCategory();
            }
        }
        return false;
    }
}
