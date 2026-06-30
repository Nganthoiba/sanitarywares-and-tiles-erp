<?php
namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;

class AccountGroup extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'parent_id', 'name', 'code', 'type'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function parent(): BelongsTo {
        return $this->belongsTo(AccountGroup::class, 'parent_id');
    }
    public function children(): HasMany {
        return $this->hasMany(AccountGroup::class, 'parent_id');
    }
    public function accounts(): HasMany {
        return $this->hasMany(Account::class);
    }
}
