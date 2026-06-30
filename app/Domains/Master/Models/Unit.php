<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Unit extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'name', 'symbol', 'type', 'decimal_places', 'is_active'];
    protected $casts = ['decimal_places' => 'integer'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
}
