<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxProfile extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'name', 'hsn_code', 'cgst_rate', 'sgst_rate', 'igst_rate', 'effective_from', 'effective_to', 'is_active'];
    protected $casts = ['rate' => 'decimal:2', 'is_active' => 'boolean'];

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }
    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
}
