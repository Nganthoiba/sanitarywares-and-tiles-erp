<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'branch_id', 'name', 'type', 'is_active', 'code', 'address'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function branch(): BelongsTo {
        return $this->belongsTo(Branch::class);
    }
    public function storageLocations(): HasMany {
        return $this->hasMany(StorageLocation::class);
    }
}
