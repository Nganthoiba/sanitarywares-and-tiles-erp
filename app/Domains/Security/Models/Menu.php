<?php

namespace App\Domains\Security\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    protected $table = 'menus';

    protected $fillable = [
        'menu_name',
        'menu_type',
        'route_uri',
        'icon',
        'parent_id',
        'permission_id',
        'order',
        'enabled',
    ];

    protected $casts = [
        'order' => 'integer',
        'enabled' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('order', 'asc');
    }

    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class, 'permission_id');
    }

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc');
    }

    public function scopeGroups($query)
    {
        return $query->where('menu_type', 'GROUP');
    }

    public function scopePages($query)
    {
        return $query->where('menu_type', 'PAGE');
    }
}
