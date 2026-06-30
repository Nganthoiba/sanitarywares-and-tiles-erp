<?php

namespace App\Domains\Workflow\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStep extends Model
{
    protected $fillable = [
        'workflow_definition_id',
        'name',
        'step_type',
        'position_x',
        'position_y',
        'width',
        'height',
        'blade_view',
        'workflow_action',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }
}
