<?php

namespace App\Domains\Master\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class Organization extends Model
{
    protected $fillable = [
        'code',
        'name',
        'legal_name',
        'business_type',
        'country',
        'state',
        'city',
        'gstin',
        'pan',
        'business_registration_number',
        'email',
        'phone',
        'website',
        'subscription_plan',
        'subscription_start',
        'subscription_expiry',
        'is_active',
        'suspension_reason',
        'address',
        'settings',
        'preferences'
    ];

    protected $casts = [
        'settings' => 'array',
        'preferences' => 'array',
        'is_active' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'organization_id');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'organization_id');
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class, 'organization_id');
    }
}
