<?php
namespace App\Domains\Product\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\TaxProfile;

class ProductFamily extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'category_id', 'brand_id', 'tax_profile_id', 'name', 'code', 'description'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function category(): BelongsTo {
        return $this->belongsTo(Category::class);
    }
    public function brand(): BelongsTo {
        return $this->belongsTo(Brand::class);
    }
    public function taxProfile(): BelongsTo {
        return $this->belongsTo(TaxProfile::class);
    }
    public function variants(): HasMany {
        return $this->hasMany(ProductVariant::class);
    }
}
