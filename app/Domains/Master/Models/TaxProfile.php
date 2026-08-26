<?php
namespace App\Domains\Master\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxProfile extends Model {
    use SoftDeletes;
    protected $fillable = ['name', 'hsn_code', 'cgst_rate', 'sgst_rate', 'igst_rate', 'effective_from', 'effective_to', 'is_active'];
    protected $casts = ['rate' => 'decimal:2', 'is_active' => 'boolean'];

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }
}
