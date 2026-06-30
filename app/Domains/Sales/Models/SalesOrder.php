<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Customer;

class SalesOrder extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'branch_id', 'customer_id', 'quotation_id', 'so_number', 'so_date', 'total_amount', 'status', 'remarks'];
    protected $casts = [
        'so_date' => 'date',
        'total_amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function branch(): BelongsTo {
        return $this->belongsTo(Branch::class);
    }
    public function customer(): BelongsTo {
        return $this->belongsTo(Customer::class);
    }
    public function quotation(): BelongsTo {
        return $this->belongsTo(Quotation::class);
    }
    public function items(): HasMany {
        return $this->hasMany(SalesOrderItem::class);
    }
}
