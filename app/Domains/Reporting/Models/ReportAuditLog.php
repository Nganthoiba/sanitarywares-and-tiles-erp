<?php

namespace App\Domains\Reporting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ReportAuditLog extends Model
{
    use BelongsToOrganization;
    protected $fillable = [
        'organization_id',
        'user_id',
        'report_type',
        'report_name',
        'filters',
        'export_type',
        'execution_time_ms',
    ];

    protected $casts = [
        'filters' => 'array',
        'execution_time_ms' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
