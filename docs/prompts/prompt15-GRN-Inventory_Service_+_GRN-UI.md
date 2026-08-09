You are the Lead ERP Architect, Senior Laravel Architect, Senior React Architect, PostgreSQL Architect, and Inventory Systems Expert.

The project is NOT a greenfield system.

A substantial portion of the ERP has already been implemented, including:

- Authentication (Sanctum)
- RBAC (Roles & Permissions)
- Multi-tenant architecture (organization_id enforced)
- Product domain
- Inventory domain (inventory_objects, inventory_movements exist)
- Purchase domain (partially implemented)

====================================================
CRITICAL INSTRUCTION
====================================================

You MUST first review the existing codebase.

DO NOT:

- Create duplicate tables
- Create duplicate models
- Create alternative inventory systems
- Ignore existing migrations

You MUST strictly extend the current architecture.

====================================================
GOAL
====================================================

Implement a complete:

1. GRN → Inventory Service (Backend)
2. GRN UI (Frontend - React)

This is the FIRST FULL BUSINESS WORKFLOW of the ERP.

====================================================
PART 1 — GAP ANALYSIS
====================================================

Review existing:

- GRN tables (if any)
- GRN items structure
- inventory_objects
- inventory_movements
- product_variants
- product types
- warehouse & storage_location

Identify:

- Missing GRN tables
- Missing fields (received_qty, rejected_qty, etc.)
- Missing slab handling
- Missing unit conversion support
- Missing storage location hierarchy

DO NOT assume anything — derive from migrations.

====================================================
PART 2 — GRN BUSINESS FLOW
====================================================

Design the exact workflow:

1. Create GRN (Draft)
2. Add Items
3. Enter quantities
4. Enter slab details (if granite)
5. Save GRN
6. Approve GRN
7. Trigger Inventory Service
8. Lock GRN (read-only)

Rules:

- PO is optional but supported
- Partial receipt allowed
- Cannot approve twice
- Cannot edit after approval

====================================================
PART 3 — GRN → INVENTORY SERVICE (CORE ENGINE)
====================================================

Use existing:

inventory_objects → stock state
inventory_movements → stock history

Implement:

InventoryService::receiveGRN($grn)

Behavior:

FOR EACH GRN ITEM:

IF product_type = GRANITE:

- Require slab details
- Create 1 inventory_object per slab
- quantity = 1
- area = length × width
- generate unique object_code

ELSE (Tiles, Sanitary, etc.):

- Convert received_qty to base unit (piece)
- Calculate area if applicable
- Create ONE aggregated inventory_object

FOR ALL:

- Create inventory_movements entry
- movement_type = PURCHASE
- reference_type = GRN
- reference_id = grn_id

====================================================
PART 4 — VALIDATIONS
====================================================

Enforce:

- GRN must be APPROVED before inventory
- Prevent duplicate processing
- slab_count == received_qty (granite)
- received_qty > 0
- warehouse exists
- organization isolation enforced

====================================================
PART 5 — STORAGE LOCATION
====================================================

Review if storage_locations table exists.

If missing:

Design minimal structure:

- id
- warehouse_id
- parent_id
- type (ZONE, RACK, SLOT)
- code

Ensure inventory_objects uses storage_location_id correctly.

====================================================
PART 6 — EVENTS
====================================================

Dispatch:

InventoryReceived event

Ensure:

- No duplicate events
- Event used for future accounting integration

====================================================
PART 7 — API DESIGN
====================================================

Generate ONLY missing APIs:

POST /grn
GET /grn
GET /grn/{id}
PUT /grn/{id}
POST /grn/{id}/approve

Ensure:

- Form Requests used
- API Resources used
- organization_id NOT accepted from client

====================================================
PART 8 — GRN UI (REACT)
====================================================

Design complete UI:

---

1. GRN LIST PAGE

---

- Table view
- Filters: date, supplier, warehouse, status
- Actions: View, Edit, Approve

---

2. CREATE GRN PAGE

---

HEADER:

- Supplier
- Warehouse
- Storage Location
- GRN Date
- Reference PO

ITEM TABLE:

- Product
- Ordered Qty
- Received Qty
- Unit
- Product Type (auto)

---

## DYNAMIC BEHAVIOR

IF product_type = GRANITE:

- Show "Enter Slabs" button
- Open slab modal

SLAB MODAL:

- Auto rows = received_qty
- Fields: length, width
- Auto-calculate area
- Validate slab count

ELSE:

- Show bulk input
- Convert box → piece
- Auto area calculation

---

## SUMMARY SECTION

- Total Quantity
- Total Area

---

## ACTIONS

- Save Draft
- Submit
- Approve

After approval:

- UI becomes READ-ONLY

====================================================
PART 9 — FRONTEND STRUCTURE
====================================================

Use modular structure:

/modules/grn/

- GRNList.jsx
- GRNForm.jsx
- GRNItemsTable.jsx
- GRNSlabModal.jsx
- GRNSummary.jsx

Reuse existing components/layout.

====================================================
PART 10 — TESTING
====================================================

Generate:

- Feature Tests (GRN creation, approval)
- Inventory creation tests
- Granite slab tests
- Bulk item tests
- Duplicate approval test

====================================================
PART 11 — OUTPUT FORMAT
====================================================

1. Gap Analysis
2. Business Flow
3. Required Database Changes (if any)
4. Backend Implementation (Services, Controllers, Events)
5. API Design
6. Frontend Design (React)
7. Validation Rules
8. Testing Plan
9. Final Checklist

====================================================
IMPORTANT RULES
====================================================

- DO NOT redesign inventory system
- DO NOT duplicate inventory tables
- DO NOT mix slab and bulk logic
- DO NOT accept organization_id from client
- ALWAYS use authenticated user context
- FOLLOW existing architecture strictly

The final implementation must be production-grade and suitable for a multi-tenant ERP system handling tiles, granite, and sanitary inventory.
