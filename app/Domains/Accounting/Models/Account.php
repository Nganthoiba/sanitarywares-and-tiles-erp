<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;

class Account extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'account_group_id', 'name', 'code', 'currency', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
    public function group(): BelongsTo
    {
        return $this->belongsTo(AccountGroup::class, 'account_group_id');
    }
    public function entries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function getBalanceAttribute(): float
    {
        $groupType = $this->group->type ?? 'ASSET';
        $isDebitType = in_array(strtoupper($groupType), ['ASSET', 'EXPENSE']);

        $debits = floatval($this->entries()->where('entry_type', 'DEBIT')->sum('amount'));
        $credits = floatval($this->entries()->where('entry_type', 'CREDIT')->sum('amount'));

        return $isDebitType ? ($debits - $credits) : ($credits - $debits);
    }
}
