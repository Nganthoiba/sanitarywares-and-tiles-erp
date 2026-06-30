<?php

namespace App\Domains\Workflow\Services;

use App\Domains\Workflow\Models\WorkflowDefinition;
use App\Domains\Workflow\Models\WorkflowInstance;
use App\Domains\Workflow\Models\WorkflowInstanceStep;
use App\Domains\Workflow\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WorkflowRunner
{
    public function __construct(
        protected TransitionResolver $resolver,
        protected ActionExecutor $executor
    ) {}

    /**
     * Start a new workflow instance for a target targetModel.
     */
    public function start(WorkflowDefinition $definition, Model $targetModel): WorkflowInstance
    {
        return DB::transaction(function () use ($definition, $targetModel) {
            // Find start node step
            $startStep = WorkflowStep::where('workflow_definition_id', $definition->id)
                ->where('step_type', 'START')
                ->first();

            if (!$startStep) {
                throw new \Exception("Workflow Definition [{$definition->code}] lacks a START node.");
            }

            $instance = WorkflowInstance::create([
                'workflow_definition_id' => $definition->id,
                'reference_type' => get_class($targetModel),
                'reference_id' => $targetModel->id,
                'current_step_id' => $startStep->id,
                'status' => 'RUNNING',
                'started_at' => now(),
            ]);

            // Save start trace log
            WorkflowInstanceStep::create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $startStep->id,
                'status' => 'COMPLETED',
                'completed_at' => now(),
            ]);

            // Process next transition immediately
            $this->moveNext($instance, $startStep, $targetModel);

            return $instance;
        });
    }

    /**
     * Complete current approval step and transition forward.
     */
    public function approve(WorkflowInstance $instance, string $user, ?string $remarks = null): void
    {
        DB::transaction(function () use ($instance, $user, $remarks) {
            $currentStepLog = WorkflowInstanceStep::where('workflow_instance_id', $instance->id)
                ->where('workflow_step_id', $instance->current_step_id)
                ->where('status', 'RUNNING')
                ->first();

            if (!$currentStepLog) {
                throw new \Exception("No active running step found for this workflow instance.");
            }

            // Complete current running step log
            $currentStepLog->update([
                'status' => 'COMPLETED',
                'completed_at' => now(),
                'remarks' => $remarks
            ]);

            $targetModel = $instance->reference_type::findOrFail($instance->reference_id);

            // Execute custom action mapped to current step on completion
            $currentStep = WorkflowStep::find($instance->current_step_id);
            if ($currentStep->workflow_action) {
                $this->executor->execute($currentStep->workflow_action, $targetModel, $currentStep->metadata);
            }

            // Resolve next step transitions
            $this->moveNext($instance, $currentStep, $targetModel);
        });
    }

    /**
     * Action transition helper to route nodes.
     */
    protected function moveNext(WorkflowInstance $instance, WorkflowStep $fromStep, Model $targetModel): void
    {
        $nextStep = $this->resolver->resolve($fromStep, $targetModel);

        if (!$nextStep) {
            // Cannot traverse further, hold in WAITING
            $instance->update([
                'status' => 'WAITING'
            ]);
            return;
        }

        $instance->update([
            'current_step_id' => $nextStep->id
        ]);

        if ($nextStep->step_type === 'END') {
            // Workflow complete
            $instance->update([
                'status' => 'COMPLETED',
                'completed_at' => now(),
            ]);

            // Create step logs
            WorkflowInstanceStep::create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $nextStep->id,
                'status' => 'COMPLETED',
                'completed_at' => now(),
            ]);

            // Execute final actions if any
            if ($nextStep->workflow_action) {
                $this->executor->execute($nextStep->workflow_action, $targetModel, $nextStep->metadata);
            }
            return;
        }

        // Node is APPROVAL, TASK, etc.
        $assignedTo = $nextStep->metadata['assigned_to'] ?? null;

        // Create next running step log
        WorkflowInstanceStep::create([
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $nextStep->id,
            'assigned_to' => $assignedTo,
            'status' => 'RUNNING',
            'started_at' => now(),
        ]);

        $instance->update([
            'status' => 'WAITING'
        ]);
    }
}
