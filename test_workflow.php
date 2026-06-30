<?php

use Illuminate\Contracts\Console\Kernel;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Supplier;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Workflow\Models\WorkflowDefinition;
use App\Domains\Workflow\Models\WorkflowStep;
use App\Domains\Workflow\Models\WorkflowTransition;
use App\Domains\Workflow\Models\WorkflowCondition;
use App\Domains\Workflow\Services\WorkflowRunner;
use App\Domains\Workflow\Services\TransitionResolver;
use App\Domains\Workflow\Services\ConditionEvaluator;
use App\Domains\Workflow\Services\ActionExecutor;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "--- Bootstrapped Laravel 12 workspace context ---\n";

\Illuminate\Support\Facades\DB::transaction(function () {
    // 1. Setup multi-tenant master data
    $org = Organization::firstOrCreate(['id' => 1]);
    $branch = Branch::firstOrCreate([
        'organization_id' => $org->id,
        'code' => 'TEST-BR',
        'name' => 'Test Branch'
    ]);
    $supplier = Supplier::firstOrCreate([
        'organization_id' => $org->id,
        'code' => 'SUPP-001',
        'name' => 'Demo Supplier'
    ]);

    echo "1. Seeded temporary organization, branch and supplier.\n";

    // 2. Setup workflow definition
    $def = WorkflowDefinition::create([
        'organization_id' => $org->id,
        'code' => 'PO-APPROVAL-FLOW',
        'name' => 'PO Multi-approval Flow',
        'description' => 'Dynamic conditional sign-off flow for PO processes',
        'module' => 'Purchase',
        'version' => 1,
        'status' => 'ACTIVE',
        'is_active' => true
    ]);

    // Create steps
    $startStep = WorkflowStep::create([
        'workflow_definition_id' => $def->id,
        'name' => 'Start Flow',
        'step_type' => 'START',
        'position_x' => 10,
        'position_y' => 10,
    ]);

    $approvalStep = WorkflowStep::create([
        'workflow_definition_id' => $def->id,
        'name' => 'Manager Sign-Off',
        'step_type' => 'APPROVAL',
        'workflow_action' => 'ApprovePurchaseAction', // Custom event action
        'metadata' => [
            'assigned_to' => 'MANAGER_ROLE'
        ],
        'position_x' => 10,
        'position_y' => 100,
    ]);

    $endStep = WorkflowStep::create([
        'workflow_definition_id' => $def->id,
        'name' => 'Approved State',
        'step_type' => 'END',
        'position_x' => 10,
        'position_y' => 200,
    ]);

    // Build transitions graph
    WorkflowTransition::create([
        'workflow_definition_id' => $def->id,
        'from_step_id' => $startStep->id,
        'to_step_id' => $approvalStep->id,
        'name' => 'Initiate'
    ]);

    WorkflowTransition::create([
        'workflow_definition_id' => $def->id,
        'from_step_id' => $approvalStep->id,
        'to_step_id' => $endStep->id,
        'name' => 'Complete'
    ]);

    echo "2. Workflow Definition rules map generated successfully.\n";

    // 3. Create target business model
    $po = PurchaseOrder::create([
        'organization_id' => $org->id,
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'po_number' => 'PO-TEST-999',
        'po_date' => now()->toDateString(),
        'total_amount' => 15000.00,
        'status' => 'DRAFT',
        'remarks' => 'Transient test document'
    ]);

    echo "3. Seeded Purchase Order record. Current PO status: {$po->status}\n";

    // 4. Trigger Workflow Engine Execution
    $evaluator = new ConditionEvaluator();
    $resolver = new TransitionResolver($evaluator);
    $executor = new ActionExecutor();
    $runner = new WorkflowRunner($resolver, $executor);

    echo "4. Initiated WorkflowRunner engine orchestrator...\n";

    $instance = $runner->start($def, $po);

    echo "Instance generated ID: {$instance->id}, status: {$instance->status}\n";
    echo "Current trace node step ID: {$instance->current_step_id} ({$instance->currentStep->name})\n";

    // Verify step log is WAITING / RUNNING for APPROVAL
    $activeStep = \App\Domains\Workflow\Models\WorkflowInstanceStep::where('workflow_instance_id', $instance->id)
        ->where('status', 'RUNNING')
        ->first();
    echo "Current running log assigned to: {$activeStep->assigned_to}\n";

    // Approve the running step
    echo "5. Triggering Approve action closure...\n";
    $runner->approve($instance, 'Test Admin', 'Approved within integration boundaries.');

    // Fetch refreshed values
    $instance->refresh();
    $po->refresh();

    echo "Transition executed! Refreshed Workflow status: {$instance->status}\n";
    echo "Final PO status: {$po->status} (Expected: APPROVED)\n";

    if ($po->status === 'APPROVED' && $instance->status === 'COMPLETED') {
        echo "\n=== INTEGRATION SUCCESS: Workflow Engine transitions verified correctly! ===\n";
    } else {
        echo "\n=== INTEGRATION FAILED: State transitions mismatch. ===\n";
    }

    throw new \Exception("Rollback to leave database pristine.");
});
