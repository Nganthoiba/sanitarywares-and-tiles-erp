<?php
namespace App\Domains\Product\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class ProductAttribute extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'name', 'slug', 'type', 'unit_id'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }

    public function unit(): BelongsTo {
        return $this->belongsTo(\App\Domains\Master\Models\Unit::class, 'unit_id');
    }

    public function attributeValues() {
        return $this->hasMany(ProductAttributeValue::class, 'product_attribute_id');
    }
}
