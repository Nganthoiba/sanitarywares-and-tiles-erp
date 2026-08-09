<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorageLocation extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'warehouse_id', 'parent_id', 'name', 'location_type', 'code'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function warehouse(): BelongsTo {
        return $this->belongsTo(Warehouse::class);
    }
    public function parent(): BelongsTo {
        return $this->belongsTo(StorageLocation::class, 'parent_id');
    }
    public function children(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(StorageLocation::class, 'parent_id');
    }
}
