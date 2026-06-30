<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;

class JournalBatch extends Model
{
    use BelongsToOrganization;
    protected $fillable = [
        'organization_id',
        'code',
        'name',
        'description',
    ];
}
