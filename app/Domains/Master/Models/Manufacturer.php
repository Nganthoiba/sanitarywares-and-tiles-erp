<?php

namespace App\Domains\Master\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Manufacturer extends Model
{
    use SoftDeletes;

    protected $table = 'manufacturers';

    protected $fillable = [
        'name',
        'legal_name',
        'trade_name',
        'cin',
        'registration_number',
        'business_constitution',
        'registered_address',
        'address',
        'phone',
        'email',
        'website',
        'is_active',
        'status',
        'verification_status',
        'verified_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'verified_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::saving(function ($manufacturer) {
            $nameVal = $manufacturer->attributes['name'] ?? null;
            $legalNameVal = $manufacturer->attributes['legal_name'] ?? null;
            $tradeNameVal = $manufacturer->attributes['trade_name'] ?? null;

            if (empty($nameVal)) {
                $manufacturer->attributes['name'] = $legalNameVal ?: ($tradeNameVal ?: 'Manufacturer');
            }
            if (empty($manufacturer->attributes['legal_name'])) {
                $manufacturer->attributes['legal_name'] = $manufacturer->attributes['name'];
            }
            if (empty($manufacturer->attributes['registered_address']) && !empty($manufacturer->attributes['address'])) {
                $manufacturer->attributes['registered_address'] = $manufacturer->attributes['address'];
            }
            if (empty($manufacturer->attributes['status'])) {
                $isAct = isset($manufacturer->attributes['is_active']) ? (bool)$manufacturer->attributes['is_active'] : true;
                $manufacturer->attributes['status'] = $isAct ? 'ACTIVE' : 'INACTIVE';
            }
        });
    }

    /**
     * Backward-compatibility accessor for 'name' attribute.
     */
    public function getNameAttribute(?string $value): string
    {
        return $value ?: ($this->trade_name ?: ($this->legal_name ?: 'Manufacturer Master'));
    }

    /**
     * Accessor for registered_address attribute.
     */
    public function getRegisteredAddressAttribute(?string $value): ?string
    {
        return $value ?: $this->attributes['address'] ?? null;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
