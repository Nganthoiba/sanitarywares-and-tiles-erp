<?php

namespace App\Domains\Workflow\Actions;

use Illuminate\Database\Eloquent\Model;

interface WorkflowActionInterface
{
    public function execute(Model $targetModel, ?array $parameters = null): void;
}
