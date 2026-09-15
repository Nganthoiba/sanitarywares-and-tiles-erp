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
    protected $fillable = [
        'organization_id', 'customer_id', 'sales_order_id', 'warehouse_id',
        'invoice_number', 'invoice_date', 'subtotal', 'discount_amount',
        'taxable_amount', 'tax_amount', 'cgst_amount', 'sgst_amount',
        'igst_amount', 'total_amount', 'paid_amount', 'due_amount',
        'round_off_amount', 'status', 'payment_status', 'payment_method', 'notes',
        'billing_address', 'shipping_address', 'is_direct_sale',
        'supplier_gstin', 'customer_gstin', 'place_of_supply_state',
        'gst_registration_type', 'supply_type', 'invoice_type',
        'is_reverse_charge', 'is_tax_inclusive', 'irn', 'ack_no',
        'ack_date', 'eway_bill_no', 'eway_bill_date'
    ];
    protected $casts = [
        'invoice_date' => 'date',
        'ack_date' => 'datetime',
        'eway_bill_date' => 'datetime',
        'subtotal' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'taxable_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'cgst_amount' => 'decimal:4',
        'sgst_amount' => 'decimal:4',
        'igst_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
        'paid_amount' => 'decimal:4',
        'due_amount' => 'decimal:4',
        'round_off_amount' => 'decimal:4',
        'is_direct_sale' => 'boolean',
        'is_reverse_charge' => 'boolean',
        'is_tax_inclusive' => 'boolean'
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
    public function warehouse(): BelongsTo {
        return $this->belongsTo(\App\Domains\Master\Models\Warehouse::class);
    }
    public function items(): HasMany {
        return $this->hasMany(InvoiceItem::class);
    }
    public function dispatches(): HasMany {
        return $this->hasMany(Dispatch::class);
    }
}
