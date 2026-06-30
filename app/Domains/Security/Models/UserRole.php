<?php
namespace App\Domains\Security\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;
use App\Models\User;

class UserRole extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'user_id', 'role_id'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
    public function role(): BelongsTo {
        return $this->belongsTo(Role::class);
    }
}
