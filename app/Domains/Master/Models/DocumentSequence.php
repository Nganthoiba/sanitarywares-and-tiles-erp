<?php

namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;
use App\Domains\Accounting\Models\FinancialYear;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentSequence extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'document_type',
        'financial_year_id',
        'fy_code',
        'current_number',
        'prefix',
        'padding',
    ];

    protected $casts = [
        'current_number' => 'integer',
        'padding' => 'integer',
    ];

    public function financialYear(): BelongsTo
    {
        return $this->belongsTo(FinancialYear::class);
    }
}
