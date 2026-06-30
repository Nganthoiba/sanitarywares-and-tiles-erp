<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class JournalEntry extends Model
{
    use BelongsToOrganization;
    use SoftDeletes;

    public static function boot(): void
    {
        parent::boot();
        static::updating(function ($model) {
            throw new \Exception("Cannot update append-only model record of type " . get_class($model));
        });
        static::deleting(function ($model) {
            throw new \Exception("Cannot delete append-only model record of type " . get_class($model));
        });
    }

    protected $fillable = ['organization_id', 'journal_id', 'account_id', 'entry_type', 'amount'];
    protected $casts = ['amount' => 'decimal:4'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
