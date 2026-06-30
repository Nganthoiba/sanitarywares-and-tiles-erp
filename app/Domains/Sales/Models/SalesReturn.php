<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Customer;

class SalesReturn extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'customer_id', 'invoice_id', 'return_number', 'return_date', 'total_amount', 'status'];
    protected $casts = [
        'return_date' => 'date',
        'total_amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function customer(): BelongsTo {
        return $this->belongsTo(Customer::class);
    }
    public function invoice(): BelongsTo {
        return $this->belongsTo(Invoice::class);
    }
    public function items(): HasMany {
        return $this->hasMany(SalesReturnItem::class);
    }
}
