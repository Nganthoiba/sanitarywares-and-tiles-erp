<?php

namespace App\Domains\Workflow\Actions;

use Illuminate\Database\Eloquent\Model;

class ApprovePurchaseAction implements WorkflowActionInterface
{
    public function execute(Model $targetModel, ?array $parameters = null): void
    {
        // Set state to approved
        $targetModel->update([
            'status' => 'APPROVED'
        ]);
    }
}
