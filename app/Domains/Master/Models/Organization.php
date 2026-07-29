<?php

namespace App\Domains\Master\Models;

use Illuminate\Database\Eloquent\Model;

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
        'address',
        'settings',
        'preferences'
    ];

    protected $casts = [
        'settings' => 'array',
        'preferences' => 'array',
        'is_active' => 'boolean',
    ];
}
