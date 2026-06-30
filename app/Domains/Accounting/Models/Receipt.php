<?php
namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class Receipt extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'account_id', 'receipt_date', 'receipt_number', 'payment_method', 'payer_type', 'payer_id', 'amount', 'status'];
    protected $casts = [
        'receipt_date' => 'date',
        'amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function account(): BelongsTo {
        return $this->belongsTo(Account::class);
    }
}
