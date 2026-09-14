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
        'name', 'sku', 'gtin', 'barcode', 'inventory_behavior', 'pieces_per_box', 'low_stock_warning_level', 'tax_profile_id', 'brand_id',
        'manufacturer_id', 'is_active'
    ];
    protected $casts = [
        'is_active' => 'boolean',
        'pieces_per_box' => 'integer',
        'low_stock_warning_level' => 'decimal:4',
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

    public function commercialPricings(): HasMany {
        return $this->hasMany(OrganizationProductPricing::class, 'product_variant_id');
    }

    public function pricings(): HasMany {
        return $this->commercialPricings();
    }

    public function currentCommercialPricing(): \Illuminate\Database\Eloquent\Relations\HasOne {
        return $this->hasOne(OrganizationProductPricing::class, 'product_variant_id')
            ->where('is_current', true);
    }

    /**
     * Authoritative resolution for pieces_per_box.
     * Order of precedence:
     * 1. Commercial Pricing (organization_product_pricings.pieces_per_box)
     * 2. Unit Conversions (unit_conversions multiplier)
     * 3. Legacy column fallback (product_variants.pieces_per_box)
     */
    public function getPiecesPerBox(): ?int {
        if ($this->relationLoaded('currentCommercialPricing') && $this->currentCommercialPricing && $this->currentCommercialPricing->pieces_per_box > 0) {
            return (int) $this->currentCommercialPricing->pieces_per_box;
        }

        $pricing = $this->currentCommercialPricing;
        if ($pricing && $pricing->pieces_per_box > 0) {
            return (int) $pricing->pieces_per_box;
        }

        $legacyVal = $this->attributes['pieces_per_box'] ?? null;
        return $legacyVal ? (int) $legacyVal : null;
    }

    public function calculatePiecesFromBoxes(float|int $boxes): ?int {
        $ppb = $this->getPiecesPerBox();
        if (!$ppb || $ppb <= 0) {
            return null;
        }
        return (int) round($boxes * $ppb);
    }

    public function calculateBoxesFromPieces(int $pieces): ?float {
        $ppb = $this->getPiecesPerBox();
        if (!$ppb || $ppb <= 0) {
            return null;
        }
        return (float) ($pieces / $ppb);
    }

    public function calculateAreaPerBox(float $areaPerPiece): ?float {
        $ppb = $this->getPiecesPerBox();
        if (!$ppb || $ppb <= 0) {
            return null;
        }
        return (float) ($areaPerPiece * $ppb);
    }

    /**
     * Get the low stock warning threshold for this product variant.
     * Designed to support future warehouse-specific or organization-level overrides.
     */
    public function getLowStockThreshold(?int $warehouseId = null): float {
        // Currently retrieves product-level threshold.
        // Can be extended to query organization_product_inventory_settings or warehouse overrides when needed.
        return (float) ($this->low_stock_warning_level ?? 0.0);
    }
}
