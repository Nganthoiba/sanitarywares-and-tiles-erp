<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankTransaction extends Model
{
    use BelongsToOrganization;
    protected $fillable = [
        'organization_id',
        'bank_account_id',
        'transaction_date',
        'transaction_type',
        'amount',
        'payment_mode',
        'reference_no',
        'status',
        'value_date',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'value_date' => 'datetime',
        'amount' => 'decimal:4',
    ];

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }
}
