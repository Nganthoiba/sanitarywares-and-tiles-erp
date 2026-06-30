<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Supplier;

class PurchaseReturn extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'supplier_id', 'supplier_invoice_id', 'return_number', 'return_date', 'total_amount', 'status'];
    protected $casts = [
        'return_date' => 'date',
        'total_amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function supplier(): BelongsTo {
        return $this->belongsTo(Supplier::class);
    }
    public function invoice(): BelongsTo {
        return $this->belongsTo(SupplierInvoice::class, 'supplier_invoice_id');
    }
    public function items(): HasMany {
        return $this->hasMany(PurchaseReturnItem::class);
    }
}
