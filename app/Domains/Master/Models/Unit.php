<?php
namespace App\Domains\Master\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        $sym = strtolower(trim($this->symbol ?? ''));
        
        if (in_array($sym, ['mm', 'cm', 'm', 'in', 'ft', 'feet', 'milimeter', 'meter'])) {
            return 'LENGTH';
        }
        if (in_array($sym, ['sq.mm', 'sq.cm', 'sq.m', 'sq.in', 'sq.ft.', 'sqft', 'sq.ft'])) {
            return 'AREA';
        }
        if (in_array($sym, ['l', 'ltr', 'litre', 'liter', 'cu.mm', 'cu.cm', 'cu.m', 'cu.ft'])) {
            return 'VOLUME';
        }
        if (in_array($sym, ['g', 'gm', 'gram', 'kg', 'ton', 'mt'])) {
            return 'MASS';
        }
        if (in_array($sym, ['pcs', 'box', 'bag', 'set', 'slab', 'roll', 'piece'])) {
            return 'COUNT';
        }

        $type = strtoupper(trim($this->type ?? ''));
        if (in_array($type, ['LENGTH', 'AREA', 'VOLUME', 'MASS', 'MEASUREMENT'])) {
            return $type;
        }

        return 'NONE';
    }
}
