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
        'gstin',
        'registration_number',
        'business_constitution',
        'address',
        'phone',
        'email',
        'website',
        'is_active',
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
            $manufacturer->name = $manufacturer->trade_name ?: ($manufacturer->legal_name ?: '');
        });
    }

    /**
     * Backward-compatibility accessor for 'name' attribute.
     */
    public function getNameAttribute(?string $value): string
    {
        return $value ?: ($this->trade_name ?: ($this->legal_name ?: ''));
    }

    /**
     * GSTIN Mutator - Normalize GSTIN (trimmed, uppercase, no internal spaces).
     */
    public function setGstinAttribute(?string $value): void
    {
        if ($value !== null) {
            $value = strtoupper(trim(preg_replace('/\s+/', '', $value)));
        }
        $this->attributes['gstin'] = $value ?: null;
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
