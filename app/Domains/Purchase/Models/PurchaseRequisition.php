<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Models\User;

class PurchaseRequisition extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'branch_id', 'pr_number', 'requested_by', 'required_date', 'status', 'remarks'];
    protected $casts = ['required_date' => 'date'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function branch(): BelongsTo {
        return $this->belongsTo(Branch::class);
    }
    public function requester(): BelongsTo {
        return $this->belongsTo(User::class, 'requested_by');
    }
    public function items(): HasMany {
        return $this->hasMany(PurchaseRequisitionItem::class);
    }
}
