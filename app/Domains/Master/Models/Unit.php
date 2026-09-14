<?php
namespace App\Domains\Master\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Domains\Master\Services\UnitDimensionService;

class Unit extends Model {
    use SoftDeletes;

    protected $fillable = ['name', 'symbol', 'type', 'decimal_places', 'is_active'];
    protected $casts = [
        'decimal_places' => 'integer',
        'is_active' => 'boolean'
    ];
    protected $appends = ['display_name', 'dimension_category'];

    public function getDisplayNameAttribute(): string {
        return "{$this->name} ({$this->symbol})";
    }

    public function getDimensionCategoryAttribute(): string {
        return UnitDimensionService::getDimensionCategory($this->symbol, $this->type);
    }

    public function isPackagingUnit(): bool {
        return $this->dimension_category === UnitDimensionService::DIMENSION_PACKAGING_COUNT;
    }

    public function isSameDimension(Unit $other): bool {
        $catA = $this->dimension_category;
        $catB = $other->dimension_category;

        return $catA !== UnitDimensionService::DIMENSION_NONE && $catA === $catB;
    }

    public function getUniversalMultiplierWith(Unit $other): ?float {
        return UnitDimensionService::getUniversalMultiplier($this, $other);
    }
}
