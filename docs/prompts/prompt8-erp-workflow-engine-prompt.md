You are acting as:

- Principal ERP Architect
- Workflow Engine Architect
- BPM (Business Process Management) Expert
- Domain Driven Design Expert
- Senior Laravel 12 Architect
- Enterprise Solution Architect

Your task is to design and generate
a production-grade configurable
Workflow Engine for a commercial
Building Materials ERP.

=========================================================
PROJECT
=========================================================

System:

Tiles - Sanitary Management and Accounting System

This is NOT merely a Tiles ERP.

This is a Building Materials ERP Platform supporting:

- Tiles
- Granite
- Marble
- Quartz
- Sanitaryware
- CP fittings
- Adhesives
- Accessories
- Future business processes

Technology:

Backend:

- Laravel 12
- PHP 8.3+
- PostgreSQL

Frontend:

- React
- Bootstrap 5

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

=========================================================
WORKFLOW PHILOSOPHY
=========================================================

Workflows must NOT be hardcoded.

Bad:

if ($amount > 100000)
{
approveByManager();
}

Good:

Workflow Definition
↓
Workflow Instance
↓
Workflow Step
↓
Workflow Action
↓
Workflow Transition

=========================================================
WORKFLOW TYPES
=========================================================

Support:

1. Linear Workflow

2. Conditional Workflow

3. Nested Conditional Workflow

4. Parallel Workflow

5. Approval Workflow

6. Multi-Level Approval Workflow

7. Dynamic Workflow

8. Event Triggered Workflow

=========================================================
EXAMPLES
=========================================================

Purchase:

Create PO
↓
Manager Approval
↓
Finance Approval
↓
GRN

Sales:

Sales Order
↓
Stock Check
↓
Allocation
↓
Dispatch
↓
Invoice

Payment:

Request
↓
Manager Approval
↓
Accounts Approval
↓
Payment

=========================================================
WORKFLOW ENGINE COMPONENTS
=========================================================

Generate:

Workflow Definition

Workflow Version

Workflow Step

Workflow Transition

Workflow Condition

Workflow Action

Workflow Instance

Workflow Instance Step

Workflow Execution

Workflow Audit

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

app/

    Domains/

        Workflow/

            Models/

            Services/

            Actions/

            Events/

            Listeners/

            DTOs/

            Policies/

            Enums/

            Repositories/

=========================================================
DATABASE TABLES
=========================================================

Generate migrations for:

workflow_definitions

workflow_versions

workflow_steps

workflow_transitions

workflow_conditions

workflow_actions

workflow_instances

workflow_instance_steps

workflow_executions

workflow_audits

=========================================================
WORKFLOW DEFINITIONS
=========================================================

Fields:

id

organization_id

code

name

description

module

version

status

is_active

=========================================================
WORKFLOW STEPS
=========================================================

Fields:

id

workflow_definition_id

name

step_type

position_x

position_y

width

height

blade_view

workflow_action

metadata

=========================================================
STEP TYPES
=========================================================

Support:

START

END

TASK

APPROVAL

CONDITION

PARALLEL

JOIN

NOTIFICATION

WEBHOOK

CUSTOM

=========================================================
WORKFLOW TRANSITIONS
=========================================================

Fields:

id

workflow_definition_id

from_step_id

to_step_id

condition_id

transition_name

sort_order

=========================================================
WORKFLOW CONDITIONS
=========================================================

Examples:

amount > 100000

branch == "IMPHAL"

inventory_available == true

credit_limit > invoice_amount

=========================================================
CONDITION OPERATORS
=========================================================

Support:

=

!=

>

<

> =

<=

IN

NOT IN

LIKE

BETWEEN

IS NULL

IS NOT NULL

=========================================================
WORKFLOW ACTIONS
=========================================================

Examples:

submit_form

approve

reject

verify_documents

allocate_inventory

dispatch_inventory

create_invoice

send_notification

post_accounting

custom_action

=========================================================
WORKFLOW INSTANCES
=========================================================

Represents:

Running workflow.

Fields:

id

workflow_definition_id

reference_type

reference_id

current_step_id

status

started_at

completed_at

=========================================================
WORKFLOW INSTANCE STEPS
=========================================================

Represents:

Execution history.

Fields:

id

workflow_instance_id

workflow_step_id

assigned_to

started_at

completed_at

status

remarks

=========================================================
WORKFLOW EXECUTION ENGINE
=========================================================

Generate:

WorkflowRunner

WorkflowEngine

TransitionResolver

ConditionEvaluator

ActionExecutor

WorkflowInstanceService

=========================================================
WORKFLOW SERVICES
=========================================================

Generate:

WorkflowDefinitionService

WorkflowDesignerService

WorkflowExecutionService

WorkflowApprovalService

WorkflowAuditService

=========================================================
WORKFLOW ACTION EXECUTION
=========================================================

Generate interfaces:

WorkflowActionInterface

Examples:

ApprovePurchaseAction

AllocateInventoryAction

DispatchInventoryAction

CreateInvoiceAction

PostAccountingAction

=========================================================
CONDITION ENGINE
=========================================================

Generate:

ConditionInterface

ConditionEvaluator

ExpressionParser

RuleEngine

Examples:

AmountGreaterThan

InventoryAvailable

BranchEquals

CreditLimitExceeded

=========================================================
WORKFLOW DESIGNER
=========================================================

Frontend requirements:

Visual Designer

Support:

- drag and drop
- resize
- move
- zoom
- pan
- connectors
- nested conditions
- multi direction graph

=========================================================
NODE TYPES
=========================================================

Generate:

StartNode

EndNode

TaskNode

ApprovalNode

ConditionNode

ParallelNode

JoinNode

NotificationNode

WebhookNode

=========================================================
WORKFLOW APPROVALS
=========================================================

Support:

Single Approval

Multi Approval

Sequential Approval

Parallel Approval

Role Approval

User Approval

Branch Approval

Amount Based Approval

=========================================================
WORKFLOW EVENTS
=========================================================

Generate:

WorkflowStarted

WorkflowStepStarted

WorkflowStepCompleted

WorkflowApproved

WorkflowRejected

WorkflowCompleted

WorkflowCancelled

=========================================================
WORKFLOW LISTENERS
=========================================================

Generate listeners:

AuditWorkflow

NotifyUsers

ExecuteActions

UpdateStatus

GenerateStatistics

=========================================================
WORKFLOW POLICIES
=========================================================

Generate:

WorkflowPolicy

ApprovalPolicy

ExecutionPolicy

DesignerPolicy

=========================================================
WORKFLOW AUDIT
=========================================================

Store:

who

when

what

old value

new value

remarks

ip address

device

=========================================================
WORKFLOW UI
=========================================================

Generate React modules:

WorkflowDesigner

WorkflowDefinitions

WorkflowExecution

WorkflowMonitor

WorkflowHistory

WorkflowApprovals

=========================================================
WORKFLOW STATE MACHINE
=========================================================

Support statuses:

DRAFT

ACTIVE

RUNNING

WAITING

APPROVED

REJECTED

COMPLETED

CANCELLED

FAILED

=========================================================
EVENT INTEGRATION
=========================================================

Workflow Engine must integrate with:

Purchase Events

Sales Events

Inventory Events

Accounting Events

Notification Events

=========================================================
API ENDPOINTS
=========================================================

Generate:

/workflow-definitions

/workflow-designer

/workflow-instances

/workflow-approvals

/workflow-history

/workflow-monitor

=========================================================
OUTPUT FORMAT
=========================================================

For every component generate:

1. Business Purpose
2. Database Schema
3. Laravel Models
4. Services
5. Actions
6. Events
7. Listeners
8. APIs
9. React Components
10. Workflow Designer
11. Security
12. Audit
13. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate an enterprise-grade
workflow engine supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Purchase approvals
- Sales approvals
- Inventory approvals
- Accounting approvals
- Dynamic workflow designer
- Nested conditional workflows
- Event-driven architecture

Never optimize for CRUD.

Always optimize for:

- Workflow flexibility
- Business correctness
- ERP architecture
- Maintainability
- Extensibility
- Scalability
