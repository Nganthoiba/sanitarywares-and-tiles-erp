<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'name', 'code', 'email', 'phone', 'address', 'is_active'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function warehouses(): HasMany {
        return $this->hasMany(Warehouse::class);
    }
}
