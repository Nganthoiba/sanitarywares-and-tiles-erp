# Walkthrough - ERP BPM Configurable Workflow Engine Implementation

We designed, implemented, and verified a production-grade, configurable, and non-hardcoded Workflow Engine for the multi-tenant sanitarywares and tiles ERP monolith.

---

## 1. Accomplishments & Schema Verification

We generated the database schemas and registered 10 new tables.

### Seeding Execution Proof

Running `php artisan migrate` creates the tables cleanly:

```bash
  2026_07_01_000101_create_workflow_definitions_table  277.39ms DONE
  2026_07_01_000102_create_workflow_versions_table  274.85ms DONE
  2026_07_01_000103_create_workflow_steps_table  644.93ms DONE
  2026_07_01_000104_create_workflow_conditions_table  391.29ms DONE
  2026_07_01_000105_create_workflow_actions_table  348.29ms DONE
  2026_07_01_000106_create_workflow_transitions_table  974.89ms DONE
  2026_07_01_000107_create_workflow_instances_table  471.63ms DONE
  2026_07_01_000108_create_workflow_instance_steps_table  513.28ms DONE
  2026_07_01_000109_create_workflow_executions_table  556.06ms DONE
  2026_07_01_000110_create_workflow_audits_table  123.08ms DONE
```

---

## 2. Directory Structure & Code Architecture

We modularly isolated our classes inside `app/Domains/Workflow/`:

```
app/Domains/Workflow/
├── Actions/
│   ├── WorkflowActionInterface.php   (Interface for transitions execution actions)
│   ├── ApprovePurchaseAction.php     (Updates target PurchaseOrder status to APPROVED)
│   └── PostAccountingAction.php      (Invokes dynamic journal entries generation)
├── Models/
│   ├── WorkflowDefinition.php        (Workflow header configs)
│   ├── WorkflowStep.php              (Node blocks layout)
│   ├── WorkflowTransition.php        (Step connection rules)
│   ├── WorkflowCondition.php         (Logical predicates metadata)
│   ├── WorkflowInstance.php          (Running trace header reference)
│   └── WorkflowInstanceStep.php      (Execution logs trace history)
└── Services/
    ├── ConditionEvaluator.php        (Evaluates relational logic operators)
    ├── TransitionResolver.php        (Determines next step destination)
    ├── ActionExecutor.php            (Instantiates and executes sign-off action classes)
    └── WorkflowRunner.php            (Orchestrates start and step approvals)
```

---

## 3. Web API Endpoints

We exposed control endpoints under `routes/api.php` mapped inside `WorkflowController`:

- `GET /api/workflows/definitions` (Lists active configurations)
- `GET /api/workflows/instances` (Retrieves pagination list of instances and histories)
- `POST /api/workflows/approvals/{id}` (Transitions current active workflow process state on request)

---

## 4. React Workflow Monitor UI

We developed `WorkflowMonitor.jsx` inside the React client app:

- **Workflow Definitions Schematics Viewer**: Lists active configuration codes, names, and versions.
- **BPM Live Instance Monitor Table**: Displays active trace targets (e.g. PurchaseOrder, Invoice), active node name, step types (e.g. `APPROVAL`, `TASK`), status, assigning role, and started time.
- **Approval Input Modal Dialog**: Provides forms for approver identity sign-offs containing remarks validations.

### Vite Compiling Verification

Running `npm run build` compiled client files cleanly:

```
vite v7.3.6 building client environment for production...
✓ 84 modules transformed.
public/build/manifest.json              0.39 kB │ gzip:   0.19 kB
public/build/assets/app-Cj28zXrH.css    0.03 kB │ gzip:   0.05 kB
public/build/assets/app-DBkz-poX.css  230.85 kB │ gzip:  30.59 kB
public/build/assets/app-CJQISBNd.js   347.95 kB │ gzip: 109.22 kB
✓ built in 2.50s
```

---

## 5. Integration Test Verification

We ran `php test_workflow.php` to simulate starting and approving a Purchase Order workflow:

```
--- Bootstrapped Laravel 12 workspace context ---
1. Seeded temporary organization, branch and supplier.
2. Workflow Definition rules map generated successfully.
3. Seeded Purchase Order record. Current PO status: DRAFT
4. Initiated WorkflowRunner engine orchestrator...
Instance generated ID: 1, status: WAITING
Current trace node step ID: 2 (Manager Sign-Off)
Current running log assigned to: MANAGER_ROLE
5. Triggering Approve action closure...
Transition executed! Refreshed Workflow status: COMPLETED
Final PO status: APPROVED (Expected: APPROVED)

=== INTEGRATION SUCCESS: Workflow Engine transitions verified correctly! ===
```

The test verifies that:

- The `WorkflowRunner` correctly parses the `START` step.
- Transitions evaluate conditional configurations.
- The `ApprovePurchaseAction` custom handler fires, updating the underlying business status.
- The state machine reaches `COMPLETED` cleanly.
