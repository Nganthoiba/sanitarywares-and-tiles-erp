<?php

namespace App\Domains\Workflow\Services;

use App\Domains\Workflow\Actions\WorkflowActionInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

class ActionExecutor
{
    /**
     * Resolve and execute an action dynamically.
     */
    public function execute(string $actionClass, Model $targetModel, ?array $parameters = null): void
    {
        if (!class_exists($actionClass)) {
            // Check if it is a shorthand key mapped under App\Domains\Workflow\Actions\
            $shorthand = "App\\Domains\\Workflow\\Actions\\" . ucfirst($actionClass);
            if (class_exists($shorthand)) {
                $actionClass = $shorthand;
            } else {
                throw new \Exception("Workflow action class [{$actionClass}] does not exist.");
            }
        }

        $actionInstance = App::make($actionClass);

        if (!$actionInstance instanceof WorkflowActionInterface) {
            throw new \Exception("Class [{$actionClass}] must implement WorkflowActionInterface.");
        }

        $actionInstance->execute($targetModel, $parameters);
    }
}
