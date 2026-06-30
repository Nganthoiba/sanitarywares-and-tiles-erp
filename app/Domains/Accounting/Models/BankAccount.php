<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankAccount extends Model
{
    use BelongsToOrganization;
    protected $fillable = [
        'organization_id',
        'account_id',
        'bank_name',
        'branch_name',
        'account_no',
        'ifsc_code',
        'account_type',
        'is_active',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
