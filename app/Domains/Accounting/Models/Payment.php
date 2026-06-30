<?php
namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class Payment extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'account_id', 'payment_date', 'payment_number', 'payment_method', 'payee_type', 'payee_id', 'amount', 'status'];
    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:4'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function account(): BelongsTo {
        return $this->belongsTo(Account::class);
    }
}
