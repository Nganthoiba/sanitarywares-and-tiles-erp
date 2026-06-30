<?php
namespace App\Domains\Sales\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Customer;

class Invoice extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'customer_id', 'sales_order_id', 'invoice_number', 'invoice_date', 'subtotal', 'tax_amount', 'total_amount', 'status'];
    protected $casts = [
        'invoice_date' => 'date',
        'subtotal' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total_amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function customer(): BelongsTo {
        return $this->belongsTo(Customer::class);
    }
    public function order(): BelongsTo {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
    public function items(): HasMany {
        return $this->hasMany(InvoiceItem::class);
    }
}
