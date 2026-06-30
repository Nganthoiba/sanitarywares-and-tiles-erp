<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyLedgerSnapshot extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'account_id',
        'snapshot_date',
        'debit_balance',
        'credit_balance',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'debit_balance' => 'decimal:4',
        'credit_balance' => 'decimal:4',
    ];

    /**
     * Relationship to Account.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
