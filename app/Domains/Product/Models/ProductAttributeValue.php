<?php
namespace App\Domains\Product\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class ProductAttributeValue extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'product_variant_id', 'product_attribute_id', 'value'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function product(): BelongsTo {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo {
        return $this->product();
    }
    public function attribute(): BelongsTo {
        return $this->belongsTo(ProductAttribute::class, 'product_attribute_id');
    }
}
