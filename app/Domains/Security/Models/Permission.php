<?php

namespace App\Domains\Security\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Permission extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'permission_group_id',
        'name',
        'display_name',
        'description',
        'slug',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(PermissionGroup::class, 'permission_group_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }

    public function menus(): HasMany
    {
        return $this->hasMany(Menu::class, 'permission_id');
    }
}
