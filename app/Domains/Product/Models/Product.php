<?php
namespace App\Domains\Product\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\Category;

class Product extends Model {
    use BelongsToOrganization;
    use SoftDeletes;

    protected $table = 'product_variants';

    protected $fillable = [
        'organization_id', 'category_id', 'purchase_unit_id', 'sales_unit_id', 'base_unit_id',
        'name', 'sku', 'gtin', 'barcode', 'inventory_behavior', 'tax_profile_id', 'brand_id',
        'manufacturer_id', 'is_active'
    ];
    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function category(): BelongsTo {
        return $this->belongsTo(Category::class);
    }
    public function purchaseUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }
    public function salesUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'sales_unit_id');
    }
    public function baseUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }
    public function taxProfile(): BelongsTo {
        return $this->belongsTo(TaxProfile::class);
    }
    public function brand(): BelongsTo {
        return $this->belongsTo(Brand::class);
    }
    public function manufacturer(): BelongsTo {
        return $this->belongsTo(Manufacturer::class);
    }
    public function attributeValues(): HasMany {
        return $this->hasMany(ProductAttributeValue::class, 'product_variant_id');
    }
}
