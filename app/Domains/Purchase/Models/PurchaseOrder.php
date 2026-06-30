<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Supplier;

class PurchaseOrder extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'branch_id', 'supplier_id', 'purchase_requisition_id', 'po_number', 'po_date', 'total_amount', 'status', 'remarks'];
    protected $casts = ['po_date' => 'date', 'total_amount' => 'decimal:4'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function branch(): BelongsTo {
        return $this->belongsTo(Branch::class);
    }
    public function supplier(): BelongsTo {
        return $this->belongsTo(Supplier::class);
    }
    public function requisition(): BelongsTo {
        return $this->belongsTo(PurchaseRequisition::class, 'purchase_requisition_id');
    }
    public function items(): HasMany {
        return $this->hasMany(PurchaseOrderItem::class);
    }
}
