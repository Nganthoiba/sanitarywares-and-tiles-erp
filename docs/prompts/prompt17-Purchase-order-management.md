You are the Lead ERP Architect, Senior Laravel Architect, Senior React Architect, PostgreSQL Architect, Procurement Domain Expert, and Enterprise ERP Business Analyst.

You are working on an EXISTING Building Materials ERP system.

This is NOT a greenfield project.

The system already contains:

- Multi-tenant organization architecture
- Organization Owner and staff authentication
- RBAC
- Branches
- Warehouses
- Suppliers
- Products
- Product Variants
- Units and conversions
- Purchase Requisitions
- Purchase Orders
- GRN
- Inventory
- Inventory Objects
- Inventory Movements
- Workflow Engine
- Accounting foundation
- React frontend
- Laravel backend

The Purchase domain already has database structures and code.

====================================================
CRITICAL INSTRUCTION
====================================================

BEFORE WRITING OR GENERATING ANY CODE:

1. Study the existing Purchase domain completely.
2. Study the purchase_requisitions migration/model/service/controller/UI.
3. Study the purchase_orders migration/model/service/controller/UI.
4. Study purchase_order_items.
5. Study suppliers.
6. Study products and product_variants.
7. Study units and unit conversions.
8. Study the Workflow Engine.
9. Study GRN implementation.
10. Study existing React architecture and reusable components.

DO NOT create duplicate:

- migrations
- models
- services
- controllers
- requests
- resources
- events
- React components
- workflow mechanisms

Extend the existing architecture.

If something already exists, improve or integrate it instead of recreating it.

====================================================
CURRENT PURCHASE ORDER DATABASE
====================================================

The existing purchase_orders table contains:

- id
- organization_id
- branch_id
- supplier_id
- purchase_requisition_id
- po_number
- po_date
- total_amount
- status
- remarks
- timestamps
- soft deletes

The existing status values are:

DRAFT
SUBMITTED
APPROVED
SENT
PARTIALLY_RECEIVED
FULLY_RECEIVED
CLOSED
CANCELLED

The existing constraint:

unique(organization_id, po_number)

MUST be preserved.

Do NOT replace the existing status architecture unless the existing codebase demonstrates a clear architectural problem.

====================================================
OBJECTIVE
====================================================

Implement a complete Purchase Order workflow.

The system must allow authorized organization staff to:

1. Create a Purchase Order
2. Optionally create it from a Purchase Requisition
3. Select a Supplier
4. Select Branch
5. Add Products
6. Specify quantities and units
7. Specify negotiated purchase prices
8. Apply discounts
9. Apply applicable taxes
10. Calculate totals
11. Save as Draft
12. Submit for approval
13. Approve
14. Send the PO to the Supplier
15. Track received quantities through GRNs
16. Track partially received and fully received quantities
17. Close the PO
18. Cancel the PO where business rules permit

====================================================
PART 1 — PURCHASE REQUISITION → PURCHASE ORDER
====================================================

Study the existing Purchase Requisition implementation.

Determine whether a PO can be created from:

A. An existing Purchase Requisition

and/or

B. Directly without a Purchase Requisition.

Do not assume.

Use the existing business architecture.

If both are supported:

Provide:

Create PO from Requisition

AND

Create Direct PO

When creating a PO from a requisition:

- Show approved requisition items
- Allow the authorized user to select items
- Allow quantities to be adjusted according to business rules
- Preserve traceability to the original requisition
- Prevent invalid duplicate conversion

Maintain:

purchase_requisition_id

where appropriate.

====================================================
PART 2 — WHO CAN CREATE A PURCHASE ORDER
====================================================

Use the existing RBAC system.

DO NOT hard-code roles such as:

"Admin can create PO"

Instead use permissions.

Recommended permission concepts:

purchase.orders.view
purchase.orders.create
purchase.orders.update
purchase.orders.submit
purchase.orders.approve
purchase.orders.send
purchase.orders.cancel
purchase.orders.close

Review existing permission naming conventions first.

Reuse existing permissions if they already exist.

====================================================
PART 3 — PURCHASE ORDER HEADER
====================================================

Design the PO form with:

Supplier
Branch
PO Date
Expected Delivery Date (only if schema supports it or determine whether it should be added)
Purchase Requisition
Reference / Quote Number (if supported)
Payment Terms
Delivery Terms
Remarks

Do NOT invent fields blindly.

Compare the required fields with the existing migration.

If an important field is missing:

Report it as a required database change before implementing it.

====================================================
PART 4 — PURCHASE ORDER ITEMS
====================================================

Study the existing purchase_order_items migration.

The item form should support:

- Product Variant
- Ordered Quantity
- Purchase Unit
- Unit Price
- Discount
- Tax
- Line Total

Use the existing unit and conversion architecture.

DO NOT create a second unit conversion mechanism.

====================================================
PART 5 — TILE PURCHASE
====================================================

Tiles may be purchased in:

- Boxes
- Pieces

The PO must preserve the purchasing unit.

Example:

Product:
600 × 600 mm Tile

Ordered:

100 Boxes

If:

1 Box = 4 Pieces

Then the system may display:

# 100 Boxes

400 Pieces

But the PO must retain:

Ordered Unit = BOX

because that is the commercial purchasing unit.

Do not unnecessarily convert the PO into pieces and lose the original purchasing unit.

====================================================
PART 6 — SANITARY PRODUCTS
====================================================

Sanitary products are generally purchased and tracked as individual units/pieces.

Example:

20 Wash Basins
10 WC Sets
50 Taps

The PO should preserve the product's configured purchasing unit.

====================================================
PART 7 — GRANITE PURCHASE
====================================================

Granite requires special treatment.

At PO stage, actual slab dimensions are normally NOT known.

Therefore:

DO NOT require individual slab records when creating a PO.

Example:

Supplier:
ABC Granite

Product:
Black Granite

Ordered:
10 Slabs

Purchase price:
₹X per sq.ft.

The PO represents the commercial order.

Actual slabs and their physical dimensions are captured during GRN.

Example during GRN:

Slab 1 → 17.8 sq.ft.
Slab 2 → 18.6 sq.ft.
Slab 3 → 19.2 sq.ft.

Therefore:

PO = expected/commercial purchase

GRN = actual physical receipt

Inventory = physical stock created from GRN

====================================================
PART 8 — PRICING
====================================================

Study the existing accounting and tax structures.

Implement the PO pricing calculation using the existing architecture.

Support where applicable:

- Unit price
- Quantity
- Discount
- Tax
- Line total
- Subtotal
- Total discount
- Total tax
- Grand total

Use decimal-safe calculations.

Never use floating-point arithmetic for monetary calculations.

Use the existing database decimal precision.

====================================================
PART 9 — PO STATUS WORKFLOW
====================================================

Use the existing PO statuses:

DRAFT
SUBMITTED
APPROVED
SENT
PARTIALLY_RECEIVED
FULLY_RECEIVED
CLOSED
CANCELLED

Enforce valid state transitions.

Recommended lifecycle:

DRAFT
↓
SUBMITTED
↓
APPROVED
↓
SENT
↓
PARTIALLY_RECEIVED
↓
FULLY_RECEIVED
↓
CLOSED

Cancellation must be controlled.

Do not allow arbitrary status updates such as:

PUT /purchase-orders/10
{
"status": "APPROVED"
}

Status transitions MUST be performed through domain/service methods.

For example:

submit()
approve()
send()
cancel()
close()

Use the existing Workflow Engine where appropriate.

Do not create a second workflow system.

====================================================
PART 10 — PURCHASE ORDER APPROVAL
====================================================

Determine how approval should work using the existing Workflow Engine.

The approval system must support future organization-specific approval policies.

Examples:

Small PO:

Purchase Manager
↓
Approved

Large PO:

Purchase Manager
↓
Branch Manager
↓
Organization Owner
↓
Approved

Do not hard-code approval chains.

Use the existing workflow architecture if it already supports this.

====================================================
PART 11 — SEND PURCHASE ORDER
====================================================

The supplier is currently an EXTERNAL ENTITY.

The supplier does NOT have an ERP login.

Do NOT create Supplier Portal functionality in this task.

After approval, the organization can:

- Generate PO PDF
- Download PO PDF
- Print PO
- Send PO through external communication channels

Design the backend so future Supplier Portal integration is possible.

The PO must clearly contain:

- Organization details
- Supplier details
- PO number
- PO date
- Items
- Quantities
- Units
- Prices
- Discounts
- Taxes
- Total
- Delivery information
- Terms
- Remarks

====================================================
PART 12 — PURCHASE ORDER → GRN
====================================================

This is extremely important.

A PO does NOT create inventory.

Inventory is created only when goods are physically received through GRN.

Therefore:

PO
↓
Supplier delivers goods
↓
GRN
↓
Inventory

The system must track:

Ordered Quantity
Received Quantity
Remaining Quantity

Example:

PO:

100 Boxes

GRN #1:

60 Boxes

Remaining:

40 Boxes

PO status:

PARTIALLY_RECEIVED

Later:

GRN #2:

40 Boxes

Remaining:

0

PO status:

FULLY_RECEIVED

The PO must never create inventory directly.

====================================================
PART 13 — OVER-RECEIPT
====================================================

Study existing GRN logic.

Determine how the current system handles receiving more than the ordered quantity.

Do not silently allow over-receipt.

Design an organization-level configurable policy if appropriate:

STRICT
→ Cannot receive more than ordered quantity.

ALLOW_WITH_APPROVAL
→ Over-receipt requires authorization.

UNRESTRICTED
→ Allowed but recorded.

Do not implement this blindly if an equivalent configuration already exists.

Reuse existing architecture.

====================================================
PART 14 — PO CANCELLATION
====================================================

Define cancellation rules.

Examples:

DRAFT
→ Can cancel

SUBMITTED
→ Can cancel according to permission

APPROVED
→ Can cancel according to authorization

SENT
→ Can cancel only if business rules permit

PARTIALLY_RECEIVED
→ Cannot simply delete

FULLY_RECEIVED
→ Cannot cancel

CLOSED
→ Cannot cancel

Do not use database deletion to cancel a PO.

Use status transitions and audit history.

====================================================
PART 15 — PO UI
====================================================

Create a professional React Purchase Order module.

Reuse the existing application layout and components.

Suggested structure:

/modules/purchase-orders/

PurchaseOrderList.jsx
PurchaseOrderForm.jsx
PurchaseOrderHeader.jsx
PurchaseOrderItemsTable.jsx
PurchaseOrderSummary.jsx
PurchaseOrderView.jsx
PurchaseOrderApproval.jsx
PurchaseOrderPdf.jsx

Do NOT create these files if equivalent components already exist.

====================================================
PART 16 — PURCHASE ORDER LIST
====================================================

Create a list page with:

PO Number
Supplier
Branch
PO Date
Total
Status
Created By
Actions

Filters:

- PO Number
- Supplier
- Branch
- Date range
- Status

Actions depend on permissions and status:

View
Edit
Submit
Approve
Send
Cancel
Close
Generate PDF

====================================================
PART 17 — PURCHASE ORDER FORM
====================================================

Header:

Supplier
Branch
PO Date
Purchase Requisition
Expected Delivery
Reference / Quote
Payment Terms
Remarks

Items:

Product
Variant
Quantity
Unit
Unit Price
Discount
Tax
Line Total

Buttons:

Save Draft
Submit

Do not show Approve or Send unless the current user has permission and the PO is in the appropriate state.

====================================================
PART 18 — SMART PRODUCT SELECTION
====================================================

When selecting a product:

Load:

- Product
- Variant
- Product category/type
- Available purchasing units
- Unit conversions
- Default purchase price if supported
- Tax profile

Do not duplicate product or unit logic in React.

The backend remains the source of truth.

====================================================
PART 19 — PO VIEW PAGE
====================================================

Display:

PO Header
Supplier
Branch
Items
Quantities
Pricing
Tax
Totals
Remarks
Status
Approval information
Receiving progress

For every item show:

Ordered
Received
Remaining

Example:

Ordered: 100 Boxes
Received: 60 Boxes
Remaining: 40 Boxes

====================================================
PART 20 — RECEIVING PROGRESS
====================================================

The PO UI must clearly show:

Overall:

Ordered
Received
Remaining

Per item:

Ordered Qty
Received Qty
Remaining Qty

For granite:

Ordered:
10 slabs

Received:
6 slabs

Remaining:
4 slabs

Do not attempt to display actual slab dimensions at PO stage.

Those belong to GRN/inventory.

====================================================
PART 21 — API
====================================================

Review existing API conventions.

Generate ONLY missing endpoints.

Potential endpoints:

GET /purchase-orders
POST /purchase-orders
GET /purchase-orders/{id}
PUT /purchase-orders/{id}
POST /purchase-orders/{id}/submit
POST /purchase-orders/{id}/approve
POST /purchase-orders/{id}/send
POST /purchase-orders/{id}/cancel
POST /purchase-orders/{id}/close

Use:

- Form Requests
- API Resources
- Policies/authorization
- Services/actions
- Existing tenant scope

Never accept organization_id from the client.

====================================================
PART 22 — DATABASE INTEGRITY
====================================================

Review existing migrations.

Do not modify the database unless necessary.

Check:

- Foreign keys
- Unique constraints
- Indexes
- Decimal precision
- Soft deletes
- Organization isolation

The existing unique constraint:

organization_id + po_number

must remain.

If schema changes are required, clearly identify them before generating migrations.

====================================================
PART 23 — EVENTS
====================================================

Review existing Purchase and Workflow events.

Use existing events where possible.

Potential events:

PurchaseOrderCreated
PurchaseOrderSubmitted
PurchaseOrderApproved
PurchaseOrderSent
PurchaseOrderCancelled
PurchaseOrderClosed

Do not create duplicate events.

Events must not directly create inventory.

Inventory creation remains the responsibility of GRN processing.

====================================================
PART 24 — AUDITABILITY
====================================================

Purchase Orders are important business documents.

Ensure the system can determine:

- Who created the PO
- Who submitted it
- Who approved it
- Who sent it
- Who cancelled it
- When each action occurred

Reuse the existing audit/event architecture.

Do not add a second audit mechanism if one already exists.

====================================================
PART 25 — TESTING
====================================================

Generate tests for:

1. Authorized user can create PO.
2. Unauthorized user cannot create PO.
3. PO can be saved as draft.
4. Draft PO can be submitted.
5. Submitted PO can be approved according to workflow.
6. Approved PO can be sent.
7. Invalid status transitions are rejected.
8. Cancelled PO cannot be edited.
9. Closed PO cannot be edited.
10. PO cannot create inventory.
11. GRN correctly updates received quantity.
12. Partial receipt changes PO to PARTIALLY_RECEIVED.
13. Complete receipt changes PO to FULLY_RECEIVED.
14. Remaining quantity is calculated correctly.
15. Over-receipt rules are enforced.
16. Organization isolation is enforced.
17. Users cannot access another organization's PO.
18. PO number uniqueness is enforced per organization.
19. Granite PO does not require slab dimensions.
20. Granite slab information is captured only at GRN.

====================================================
PART 26 — OUTPUT FORMAT
====================================================

Your response MUST be structured exactly as follows:

1. Existing Purchase Architecture Review

2. Purchase Requisition → Purchase Order Analysis

3. Purchase Order Schema Review

4. Missing / Required Changes

5. Purchase Order Business Workflow

6. Status Transition Design

7. RBAC / Permission Requirements

8. Workflow Engine Integration

9. Purchase Order Service Design

10. API Design

11. React UI/UX Design

12. Purchase Order → GRN Integration

13. Validation & Business Rules

14. Events & Audit Trail

15. Database Changes

16. Backend Implementation Plan

17. Frontend Implementation Plan

18. Test Plan

19. Final Implementation Checklist

====================================================
FINAL RULES
====================================================

DO NOT:

- Create duplicate Purchase Order functionality
- Create a second workflow engine
- Create a second unit conversion system
- Create inventory from PO
- Create granite slabs during PO creation
- Accept organization_id from client
- Allow arbitrary status manipulation
- Delete approved business documents
- Create Supplier Portal functionality
- Bypass RBAC
- Bypass tenant isolation

The Purchase Order must remain the commercial commitment to purchase.

GRN remains the physical confirmation of received goods.

Inventory remains the physical stock state created from GRN.

The final implementation must fit the existing Laravel + React Modular Monolith / DDD architecture and existing database design.
