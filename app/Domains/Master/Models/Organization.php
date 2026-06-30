<?php

namespace App\Domains\Master\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'code',
        'name',
        'legal_name',
        'gstin',
        'pan',
        'email',
        'phone',
        'website',
        'subscription_plan',
        'subscription_start',
        'subscription_expiry',
        'is_active',
        'address'
    ];
}
