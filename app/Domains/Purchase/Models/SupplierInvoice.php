<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Supplier;

class SupplierInvoice extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'supplier_id', 'goods_receipt_note_id', 'invoice_number', 'invoice_date', 'subtotal', 'tax_amount', 'total_amount'];
    protected $casts = [
        'invoice_date' => 'date',
        'subtotal' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total_amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function supplier(): BelongsTo {
        return $this->belongsTo(Supplier::class);
    }
    public function grn(): BelongsTo {
        return $this->belongsTo(GoodsReceiptNote::class, 'goods_receipt_note_id');
    }
    public function items(): HasMany {
        return $this->hasMany(SupplierInvoiceItem::class);
    }
}
