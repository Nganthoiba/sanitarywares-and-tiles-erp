<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'name', 'code', 'email', 'phone', 'gstin', 'address', 'state', 'city', 'pincode', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
}
