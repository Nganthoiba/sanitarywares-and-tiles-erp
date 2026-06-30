<?php

namespace App\Http\Controllers\Api\Workflow;

use App\Http\Controllers\Controller;
use App\Domains\Workflow\Models\WorkflowDefinition;
use App\Domains\Workflow\Models\WorkflowInstance;
use App\Domains\Workflow\Models\WorkflowInstanceStep;
use App\Domains\Workflow\Services\WorkflowRunner;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WorkflowController extends Controller
{
    public function __construct(
        protected WorkflowRunner $runner
    ) {}

    /**
     * GET /api/workflows/definitions
     */
    public function listDefinitions(Request $request): JsonResponse
    {
        $definitions = WorkflowDefinition::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $definitions
        ]);
    }

    /**
     * GET /api/workflows/instances
     */
    public function listInstances(Request $request): JsonResponse
    {
        $instances = WorkflowInstance::with(['definition', 'currentStep', 'steps.step'])
            ->latest()
            ->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $instances
        ]);
    }

    /**
     * POST /api/workflows/approvals/{id}
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'user' => ['required', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        $instance = WorkflowInstance::findOrFail($id);

        try {
            $this->runner->approve($instance, $request->input('user'), $request->input('remarks'));

            return response()->json([
                'success' => true,
                'message' => 'Workflow transitioned and approved successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
