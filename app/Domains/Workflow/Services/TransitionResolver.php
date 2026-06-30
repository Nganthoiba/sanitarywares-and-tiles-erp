<?php

namespace App\Domains\Workflow\Services;

use App\Domains\Workflow\Models\WorkflowStep;
use App\Domains\Workflow\Models\WorkflowTransition;
use Illuminate\Database\Eloquent\Model;

class TransitionResolver
{
    public function __construct(
        protected ConditionEvaluator $evaluator
    ) {}

    /**
     * Resolve the next step to traverse.
     */
    public function resolve(WorkflowStep $currentStep, Model $targetModel): ?WorkflowStep
    {
        // Fetch all transitions matching the source step ID
        $transitions = WorkflowTransition::where('from_step_id', $currentStep->id)
            ->orderBy('sort_order', 'asc')
            ->get();

        $defaultTransition = null;

        foreach ($transitions as $transition) {
            if (!$transition->condition_id) {
                $defaultTransition = $transition;
                continue;
            }

            // Evaluate condition
            if ($this->evaluator->evaluate($transition->condition, $targetModel)) {
                return WorkflowStep::find($transition->to_step_id);
            }
        }

        // Fallback to default transition if no conditional transition matches
        if ($defaultTransition) {
            return WorkflowStep::find($defaultTransition->to_step_id);
        }

        return null;
    }
}
