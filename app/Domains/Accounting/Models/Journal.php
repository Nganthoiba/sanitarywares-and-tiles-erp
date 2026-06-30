<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Master\Models\Organization;
use App\Models\User;

class Journal extends Model
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

    protected $fillable = ['organization_id', 'journal_date', 'reference_type', 'reference_id', 'narration', 'created_by'];
    protected $casts = ['journal_date' => 'date'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function entries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }
}
