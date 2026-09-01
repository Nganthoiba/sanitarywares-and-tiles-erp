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
    protected $fillable = ['organization_id', 'parent_id', 'name', 'description', 'sort_order', 'is_active', 'slug'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function parent(): BelongsTo {
        return $this->belongsTo(Category::class, 'parent_id');
    }
    public function children(): HasMany {
        return $this->hasMany(Category::class, 'parent_id');
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
