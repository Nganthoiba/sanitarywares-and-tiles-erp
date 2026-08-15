<?php
namespace App\Domains\Product\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Unit;

class UnitConversion extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'product_variant_id', 'from_unit_id', 'to_unit_id', 'multiplier'];
    protected $casts = ['multiplier' => 'decimal:6'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function product(): BelongsTo {
        return $this->belongsTo(Product::class, 'product_variant_id');
    }
    public function variant(): BelongsTo {
        return $this->product();
    }
    public function fromUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }
    public function toUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'to_unit_id');
    }
}
