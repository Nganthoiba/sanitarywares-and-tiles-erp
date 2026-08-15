PROMPT 21 — PURCHASE ORDER SIMPLIFICATION, UNIT CONVERSION &
PRICING ARCHITECTURE REFACTORING

You are working on an EXISTING Laravel + React ERP system for:

- Tiles
- Sanitaryware
- Granite
- Marble
- Other building materials

The project already contains:

- Products / Product Variants
- Product Families
- Units of Measure
- Unit Conversions
- Purchase Requisitions
- Purchase Orders
- Purchase Order Items
- GRN
- Inventory
- Granite/Marble slab tracking
- Tax profiles
- Organization-level tenancy

The current Purchase Order implementation has become unnecessarily complex because the PO line allows users to independently select:

- Order Quantity
- Order Unit
- Pricing Unit
- Expected Area
- Rate Per Pricing Unit

This creates ambiguity, especially for products such as tiles where:

    Order Unit = BOX
    Pricing Unit = PCS

may be valid only if a product-specific conversion exists.

The objective of this task is to redesign the Purchase Order architecture and UI so that:

1. Normal purchases are extremely simple.
2. Unit conversions are defined at the product/unit configuration level.
3. Purchase Orders consume those configurations instead of inventing relationships.
4. Alternate pricing units are allowed only when a valid conversion exists.
5. Granite/Marble are handled as measured materials rather than fixed unit conversions.
6. GRN remains responsible for actual received measurements.
7. Historical PO calculations remain immutable even if product configuration changes later.
8. The database is restructured where necessary.
9. React does not become the business-rule engine.
10. Existing organization isolation and domain boundaries remain intact.

============================================================
PART 1 — STUDY THE EXISTING IMPLEMENTATION FIRST
============================================================

Before changing anything, inspect the existing implementation.

At minimum inspect:

1. PurchaseOrderForm.jsx
2. PurchaseOrderList.jsx
3. PurchaseOrderView.jsx
4. PurchaseOrder models
5. PurchaseOrderItem model
6. PurchaseOrder migrations
7. Unit model
8. UnitConversion model
9. Product Variant model
10. Product Unit configuration
11. Product Service
12. PurchaseOrderService
13. GRNService
14. GRN models
15. Inventory models/services
16. Existing ProductEntry/Product Catalog implementation
17. Existing migrations involving:
    - unit_id
    - pricing_unit_id
    - estimated_pricing_quantity
    - received_pricing_quantity
    - pieces_per_box
    - unit_conversions
18. Existing tests.

Search the ENTIRE CODEBASE for usages of:

    pricing_unit_id
    estimated_pricing_quantity
    received_pricing_quantity
    pieces_per_box
    unit_id
    unit_conversions

Do not delete or rename anything until all dependencies are understood.

============================================================
PART 2 — CORE ARCHITECTURAL PRINCIPLE
============================================================

The fundamental rule is:

    PRODUCT CONFIGURATION
            ↓
    VALID UNITS / CONVERSIONS
            ↓
    PURCHASE ORDER
            ↓
           GRN
            ↓
        INVENTORY

The Purchase Order must NOT invent or arbitrarily define unit relationships.

The product/unit configuration determines what conversions are possible.

Example:

Product:
600×600 Tile

Configured Units:

    PCS
    BOX

Configured conversion:

    1 BOX = 4 PCS

The PO can therefore legitimately support:

    100 BOX at ₹800 / BOX

or:

    100 BOX at ₹200 / PCS

or:

    400 PCS at ₹800 / BOX

because the relationship is known.

If no relationship exists between the selected units, the PO must NOT allow the alternate pricing basis.

============================================================
PART 3 — SIMPLIFY THE NORMAL PO EXPERIENCE
============================================================

The NORMAL purchase order line should expose only:

    Product
    Quantity
    Unit
    Rate
    Amount

Example:

    Product: 600×600 White Tile
    Quantity: 100
    Unit: BOX
    Rate: ₹800
    Amount: ₹80,000

The normal user should NOT have to deal with:

    Pricing Unit
    Pricing Quantity
    Conversion Factor
    Estimated Pricing Quantity

unless the selected product actually requires one of those concepts.

============================================================
PART 4 — DEFAULT PRICING BEHAVIOR
============================================================

By default:

    Pricing Unit = Order Unit

Example:

    Quantity: 100
    Unit: BOX
    Rate: ₹800 / BOX

Amount:

    100 × ₹800 = ₹80,000

This should be the normal experience.

Do not expose a separate Pricing Unit selector by default.

============================================================
PART 5 — ALTERNATE PRICING UNIT
============================================================

An alternate pricing unit may be used ONLY if:

1. The product supports the pricing unit.
2. A valid conversion exists between the order unit and pricing unit.
3. The conversion is applicable to that specific product.
4. The conversion is deterministic/fixed.

Example:

Product:

    600×600 Tile

Product-specific conversion:

    1 BOX = 4 PCS

PO:

    Order Quantity = 100
    Order Unit = BOX
    Price = ₹200
    Pricing Unit = PCS

The system calculates:

    100 BOX × 4 PCS/BOX
    = 400 PCS

    400 PCS × ₹200
    = ₹80,000

The user should NOT manually enter:

    4 PCS per BOX

during PO creation.

That relationship belongs to Product Unit Configuration.

============================================================
PART 6 — INVALID CONVERSION
============================================================

If the user attempts:

    Order Unit = BOX
    Pricing Unit = PCS

but the product has no valid conversion:

    1 BOX = X PCS

then PCS must NOT be offered as a pricing basis.

The UI should either:

1. Hide the unavailable pricing unit,

or:

2. Show a clear validation message:

    "PCS pricing is unavailable because no valid
    BOX → PCS conversion is configured for this product."

Do not silently assume a conversion.

Do not use arbitrary global conversion values for product-specific packaging relationships.

============================================================
PART 7 — PRODUCT-SPECIFIC VS GLOBAL CONVERSIONS
============================================================

Distinguish between:

A. UNIVERSAL conversions

Examples:

    1 M = 100 CM
    1 SQ.M = 10.7639 SQ.FT.

These may be represented globally if the existing architecture supports them safely.

B. PRODUCT-SPECIFIC conversions

Examples:

    Tile A:
        1 BOX = 4 PCS

    Tile B:
        1 BOX = 2 PCS

These MUST be associated with the relevant product/variant.

Do not assume:

    1 BOX = X PCS

globally for all tile products.

============================================================
PART 8 — PRODUCT UNIT CONFIGURATION
============================================================

Review the existing Unit and UnitConversion architecture.

If necessary, restructure it so that a product variant can clearly define:

    Available Units

and:

    Valid Conversions

Example:

Product:
600×600 White Tile

Units:

    PCS
    BOX

Conversion:

    1 BOX = 4 PCS

The Product Unit Configuration should become the source of truth.

The Purchase Order should consume this configuration.

Do not duplicate conversion definitions inside the PO.

============================================================
PART 9 — DO NOT USE "PIECES PER BOX"
============================================================

If the current system contains:

    pieces_per_box

do not continue using it as the primary mechanism.

A rule such as:

    1 BOX = 4 PCS

must be represented through the generic Unit Conversion architecture.

Do not introduce:

    pieces_per_dozen
    meters_per_roll
    pieces_per_carton
    etc.

as special product columns.

Use generic unit conversion.

Before removing an existing field:

1. Search all usages.
2. Determine dependencies.
3. Determine whether existing data must be migrated.
4. Create a safe migration if necessary.
5. Preserve existing records.

============================================================
PART 10 — GRANITE AND MARBLE ARE DIFFERENT
============================================================

Granite and marble must NOT use a fixed conversion such as:

    1 SLAB = X SQ.FT.

because each slab may have a different area.

Example:

    Slab 1 = 18.4 SQ.FT.
    Slab 2 = 20.1 SQ.FT.
    Slab 3 = 17.9 SQ.FT.

Therefore:

    SLAB → SQ.FT.

is a VARIABLE MEASUREMENT relationship, not a fixed UOM conversion.

============================================================
PART 11 — MEASURED MATERIAL PO
============================================================

For a measured material:

    Product = Black Granite
    Product Type = Measured Material

PO should allow:

    Quantity = 10
    Unit = SLAB
    Rate = ₹180
    Rate Basis = SQ.FT.

Optionally:

    Expected Area = 200 SQ.FT.

The UI should make this understandable as:

    10 SLABS
    ₹180 per SQ.FT.
    Expected Area: approximately 200 SQ.FT.

The user should NOT be required to configure:

    1 SLAB = 20 SQ.FT.

because that is false as a fixed conversion.

============================================================
PART 12 — EXPECTED AREA
============================================================

For granite/marble, expected area is an estimate only.

Do not treat:

    10 SLABS
    Expected Area = 200 SQ.FT.

as proof that the actual stock contains exactly 200 SQ.FT.

The actual slab measurements are determined during GRN.

The PO should preserve the expected measurement as a commercial/planning value.

Use a clear database field such as:

    estimated_measurement

if the existing architecture allows a better name than:

    estimated_pricing_quantity

Do not rename blindly. First inspect dependencies and migration history.

============================================================
PART 13 — GRN RESPONSIBILITY
============================================================

GRN is responsible for actual receipt.

For granite:

PO:

    10 SLABS
    ₹180 / SQ.FT.
    Expected Area = 200 SQ.FT.

GRN:

    Slab 1 → 18.4 SQ.FT.
    Slab 2 → 20.1 SQ.FT.
    Slab 3 → 19.2 SQ.FT.
    ...

The actual received measurement becomes known at GRN.

The inventory system then stores the physical slab objects and their actual measurements.

Do not force the PO to know individual slab dimensions.

============================================================
PART 14 — PO LINE DATA MODEL
============================================================

Review the existing purchase_order_items schema.

The target conceptual model should be:

    id
    organization_id
    purchase_order_id
    product_variant_id

    quantity
    unit_id

    pricing_mode
    unit_price

    pricing_unit_id          nullable
    pricing_quantity         nullable

    discount_amount
    tax_rate
    tax_amount
    subtotal

    received_quantity
    received_pricing_quantity

    timestamps

However, DO NOT blindly implement this exact schema.

First determine whether the existing schema already supports the required behavior.

The preferred conceptual pricing modes are initially:

    UNIT
    MEASURED

UNIT:

    Normal products.

MEASURED:

    Granite / Marble / other variable-measure products.

Do not create a large generic pricing engine at this stage.

============================================================
PART 15 — PRICING_MODE
============================================================

If a pricing mode is required, use a controlled enum/value set.

Example:

    UNIT
    MEASURED

UNIT:

    100 BOX
    ₹800 / BOX

MEASURED:

    10 SLAB
    ₹180 / SQ.FT.

Do not create dozens of pricing modes.

The design must remain extensible without becoming unnecessarily abstract.

============================================================
PART 16 — HISTORICAL CONVERSION SNAPSHOT
============================================================

This is critical.

Suppose the product currently has:

    1 BOX = 4 PCS

PO:

    100 BOX
    ₹200 / PCS

The system calculates:

    400 PCS × ₹200
    = ₹80,000

Later, the product configuration changes to:

    1 BOX = 6 PCS

The historical PO MUST NOT change.

The PO must preserve the conversion that was actually used.

Therefore, when an alternate pricing unit is used, snapshot the necessary commercial data.

Potential fields:

    pricing_unit_id
    pricing_conversion_factor
    pricing_quantity

Do not rely on current product configuration to recalculate historical POs.

This is required for auditability and financial correctness.

============================================================
PART 17 — RECEIVED PRICING QUANTITY
============================================================

Review:

    received_pricing_quantity

Determine whether it is genuinely required or whether it can be derived from:

    received_quantity
    +
    historical conversion snapshot

For normal fixed-unit products, avoid redundant stored quantities if they can safely be derived.

For measured materials, actual measurement belongs to GRN.

Do not remove the field without checking existing accounting, GRN, reporting, and inventory dependencies.

============================================================
PART 18 — PURCHASE ORDER UI
============================================================

Redesign PurchaseOrderForm.jsx.

The default line item should be:

    Product
    Quantity
    Unit
    Rate
    Amount

Example:

---

## Product Qty Unit Rate Amount

600×600 White Tile 100 BOX ₹800 ₹80,000
Wash Basin 20 PCS ₹2,500 ₹50,000

---

Do not show:

    Pricing Unit

as a normal mandatory column.

============================================================
PART 19 — ADD PRODUCT FLOW
============================================================

Prefer an:

    + Add Product

interaction.

Selecting Add Product should allow the user to choose a product and then enter the minimum required information.

For standard products:

    Product
    Quantity
    Unit
    Rate

For measured materials:

    Product
    Quantity
    Unit
    Rate Basis
    Rate
    Expected Measurement (optional)

Do not make the user fill unnecessary fields.

============================================================
PART 20 — OPTIONAL ALTERNATE PRICING
============================================================

If a standard product has a valid alternate pricing unit, provide an unobtrusive option such as:

    Rate
    [ ₹800 ]

    Price per
    [ BOX ▼ ]

The default must be the order unit.

If the user changes:

    Price per = PCS

the backend/frontend must verify that a valid product-specific conversion exists.

If valid:

    1 BOX = 4 PCS

show a small explanatory hint:

    100 BOX = 400 PCS for pricing

The user should understand the calculation.

If invalid:

    do not allow PCS pricing.

============================================================
PART 21 — GRANITE/MARBLE UI
============================================================

When a measured material is selected, dynamically change the relevant fields.

Example:

    Product
    Black Granite

    Quantity
    10

    Unit
    SLAB

    Rate
    ₹180

    Price per
    SQ.FT.

    Expected Area
    200 SQ.FT.

Display:

    Estimated Amount: ₹36,000

Clearly label this as an estimate if appropriate.

Do not present:

    SLAB → SQ.FT.

as a fixed conversion.

============================================================
PART 22 — PO HEADER SIMPLIFICATION
============================================================

The PO header should be simplified.

Primary fields:

    Supplier
    Branch
    PO Date

Optional:

    Purchase Requisition

Additional details should be collapsed or placed in a secondary section:

    Expected Delivery Date
    Supplier Reference
    Payment Terms
    Delivery Terms
    Internal Remarks

Use:

    ▸ Additional Details

or equivalent progressive disclosure.

============================================================
PART 23 — PURCHASE REQUISITION FLOW
============================================================

Support two clear workflows:

    Start New Purchase Order

and:

    Create from Approved Purchase Requisition

Do not make PR conversion look like an ordinary unrelated header field.

Suggested workflow:

    Create Purchase Order

    ○ Start New Order
    ○ From Approved Requisition

If the second option is selected:

    Approved Requisition
    [ PR-2026-0001 ▼ ]

Then automatically populate the PO items.

Do not require users to manually re-enter requisition items.

============================================================
PART 24 — DISCOUNT AND TAX
============================================================

Keep discount and tax functionality.

However, do not overload each PO line with unnecessary fields.

Possible approach:

    Product
    Quantity
    Unit
    Rate
    Amount

Then allow:

    Discount
    Tax

through an expandable line editor or appropriate secondary UI.

The final PO must still preserve exact financial values.

============================================================
PART 25 — BACKEND MUST BE AUTHORITATIVE
============================================================

React should display calculations, but Laravel must be authoritative.

Do NOT rely on React for final:

    unit conversion
    pricing quantity
    subtotal
    discount
    tax
    total

The backend must recalculate and validate all monetary and conversion data.

React values are user input, not authoritative accounting values.

============================================================
PART 26 — VALIDATION RULES
============================================================

The backend must reject:

1. Invalid product.
2. Invalid organization.
3. Invalid unit.
4. Unit not configured for product.
5. Alternate pricing unit without valid conversion.
6. Invalid conversion.
7. Negative quantity.
8. Invalid rate.
9. Invalid tax rate.
10. Invalid discount.
11. Measured material without valid measurement basis.
12. Unauthorized supplier/branch.
13. Invalid PR conversion.
14. Attempts to modify non-draft PO lines.

Use Laravel Form Requests and domain services appropriately.

============================================================
PART 27 — ORGANIZATION ISOLATION
============================================================

Every PO query and operation MUST be organization-scoped.

Do not trust:

    organization_id

from React.

Derive organization context from the authenticated user/session.

Ensure:

    Product
    Supplier
    Branch
    Purchase Requisition
    Unit Configuration
    Unit Conversion

all belong to the correct organization where applicable.

============================================================
PART 28 — DATABASE RESTRUCTURING
============================================================

Database restructuring IS permitted and encouraged where it genuinely simplifies the domain.

However:

DO NOT blindly drop existing columns.

For every candidate field:

    pricing_unit_id
    estimated_pricing_quantity
    received_pricing_quantity
    pieces_per_box

perform:

1. Search codebase usage.
2. Identify database dependencies.
3. Identify API dependencies.
4. Identify reporting dependencies.
5. Identify GRN dependencies.
6. Identify inventory dependencies.
7. Determine whether field is redundant.
8. Propose migration.
9. Preserve existing data.
10. Update tests.

If a field is still needed for historical/audit purposes, keep it.

============================================================
PART 29 — UNIT CONVERSION DATA MODEL
============================================================

Review whether the current:

    unit_conversions

table is sufficient.

The desired conceptual structure is:

    Product Variant
          │
          ├── Unit A
          ├── Unit B
          │
          └── Conversion
                  │
                  ├── From Unit
                  ├── To Unit
                  └── Factor

Example:

    Tile A

    BOX
    PCS

    1 BOX = 4 PCS

Do not create unnecessary conversion tables if the current structure already provides this correctly.

============================================================
PART 30 — PRODUCT UNIT CONFIGURATION
============================================================

If the current product architecture does not provide a clean way to configure:

    available units
    purchase-allowed units
    sales-allowed units
    conversions

design the minimum required structure.

Do NOT implement a huge UOM management engine.

The immediate requirement is:

    Product Variant
        ↓
    Valid Units
        ↓
    Valid Fixed Conversions

============================================================
PART 31 — UNIT SELECTION IN PO
============================================================

When a product is selected, the Unit selector should show only valid units configured for that product.

Example:

Product:
Tile A

Available:

    PCS
    BOX

The user may select:

    BOX

If the user wants alternate pricing:

    BOX → PCS

must be validated against the product's conversion.

Do not show unrelated organization-wide units.

============================================================
PART 32 — PRICE BASIS
============================================================

Avoid exposing the technical term:

    Pricing Unit

where possible.

Prefer:

    Price per

Example:

    Quantity: 100
    Unit: BOX

    Rate: ₹200
    Price per: PCS

This is more understandable to users.

For normal purchases:

    Price per = BOX

For granite:

    Price per = SQ.FT.

============================================================
PART 33 — AMOUNT CALCULATION
============================================================

Normal UNIT pricing:

    quantity × unit_price

Example:

    100 BOX × ₹800/BOX
    = ₹80,000

Converted pricing:

    quantity × conversion_factor × unit_price

Example:

    100 BOX × 4 PCS/BOX × ₹200/PCS
    = ₹80,000

Measured pricing:

    estimated_measurement × unit_price

Example:

    200 SQ.FT. × ₹180
    = ₹36,000 estimated

Actual received value for measured materials must be determined according to the GRN/accounting design.

============================================================
PART 34 — PURCHASE ORDER STATUS
============================================================

Preserve the existing PO status architecture unless the current implementation requires correction.

Expected lifecycle remains conceptually:

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

CANCELLED should remain available according to business rules.

Do not introduce a Workflow Engine as part of this task.

Workflow requirements may vary by organization and should remain separate from this core purchasing implementation.

============================================================
PART 35 — NO WORKFLOW ENGINE
============================================================

Do NOT introduce or depend on the Workflow Engine for this PO implementation.

The basic PO state machine should be implemented directly and cleanly.

If an organization-specific approval process is needed in the future, it can be introduced as a separate configurable layer.

Do not make the basic Purchase Order workflow dependent on an organization-specific workflow engine.

============================================================
PART 36 — GRN INTEGRATION
============================================================

Review the existing GRNService.

Ensure PO receiving uses the correct quantity semantics.

For standard products:

    PO:
    100 BOX

    GRN:
    60 BOX

Remaining:

    40 BOX

For converted pricing:

    PO:
    100 BOX
    price based on PCS
    historical conversion = 4 PCS/BOX

The commercial calculation must remain based on the PO snapshot.

For granite:

    PO:
    10 SLAB
    estimated 200 SQ.FT.

GRN:

    actual slab measurements

Inventory:

    individual slab objects

============================================================
PART 37 — OVER-RECEIPT
============================================================

Preserve the existing over-receipt policy architecture.

The PO quantity is the primary ordered quantity.

For example:

    Ordered:
    100 BOX

Do not accidentally compare:

    100 BOX

against:

    400 PCS

without applying the correct conversion.

The backend must compare quantities using the appropriate unit/conversion context.

For measured materials, define clearly how over-receipt is evaluated:

    Slab count

and, where appropriate:

    actual measured area

must not be confused.

============================================================
PART 38 — ACCOUNTING AND AUDIT
============================================================

Purchase Order values must remain historically correct.

Once a PO is finalized/approved:

    product configuration changes
    unit conversion changes
    product price changes

must NOT change the historical PO.

Store sufficient transaction snapshots to preserve:

    quantity
    unit
    price
    pricing basis
    conversion used
    calculated pricing quantity
    discount
    tax
    totals

Use snapshots only where necessary for auditability.

============================================================
PART 39 — REACT COMPONENT ARCHITECTURE
============================================================

Refactor the existing PurchaseOrderForm.jsx rather than blindly replacing it.

Possible structure:

    PurchaseOrderForm.jsx
        ├── PurchaseOrderHeader.jsx
        ├── PurchaseOrderSourceSelector.jsx
        ├── PurchaseOrderItems.jsx
        │       └── PurchaseOrderItemRow.jsx
        ├── AddProductModal.jsx
        ├── MeasuredMaterialFields.jsx
        ├── PurchaseOrderAdditionalDetails.jsx
        └── PurchaseOrderSummary.jsx

Reuse existing components where appropriate.

Do not create duplicate components.

============================================================
PART 40 — REMOVE COMPLEXITY FROM PURCHASE ORDER ITEM ROW
============================================================

Normal row:

    Product
    Quantity
    Unit
    Rate
    Amount

Optional advanced pricing:

    Price per

only when supported.

Measured material:

    Product
    Quantity
    Unit
    Price per
    Rate
    Expected Measurement
    Estimated Amount

Do not expose all fields for every product.

============================================================
PART 41 — USER EXPERIENCE
============================================================

The user should feel:

"I select a product, enter how many I want, tell the system the price, and continue."

Not:

"I need to understand UOM conversion, pricing quantity, order unit, pricing unit, and accounting units before I can create a PO."

Use progressive disclosure.

Only expose complexity when the selected product requires it.

============================================================
PART 42 — EXAMPLES THAT MUST WORK
============================================================

TEST CASE A — TILE, PRICE PER BOX

Product:
600×600 Tile

Configured:
1 BOX = 4 PCS

PO:

    100 BOX
    ₹800 / BOX

Result:

    ₹80,000

---

TEST CASE B — TILE, PRICE PER PIECE

Product:
600×600 Tile

Configured:
1 BOX = 4 PCS

PO:

    100 BOX
    ₹200 / PCS

System calculates:

    400 PCS
    × ₹200

Result:

    ₹80,000

---

TEST CASE C — TILE, BUY PCS, PRICE BOX

Product:
600×600 Tile

Configured:
1 BOX = 4 PCS

PO:

    400 PCS
    ₹800 / BOX

System calculates:

    100 BOX
    × ₹800

Result:

    ₹80,000

---

TEST CASE D — INVALID TILE CONVERSION

Product:

    BOX
    PCS

No conversion exists.

Attempt:

    100 BOX
    ₹200 / PCS

Result:

    REJECT

Reason:

    No valid BOX → PCS conversion exists.

---

TEST CASE E — GRANITE

Product:
Black Granite

Type:
Measured Material

PO:

    10 SLAB
    ₹180 / SQ.FT.
    Expected Area = 200 SQ.FT.

Result:

    Estimated Amount = ₹36,000

Do NOT create:

    1 SLAB = 20 SQ.FT.

as a fixed conversion.

---

TEST CASE F — GRANITE VARIABLE SLABS

GRN:

    Slab 1 = 18.4 SQ.FT.
    Slab 2 = 20.1 SQ.FT.
    Slab 3 = 17.9 SQ.FT.

The system must preserve the actual measurement per slab.

============================================================
PART 43 — TESTING
============================================================

Create/update feature tests for:

1. Standard PO creation.
2. Tile PO priced per BOX.
3. Tile PO priced per PCS.
4. Tile PO ordered in PCS and priced per BOX.
5. Invalid conversion rejection.
6. Product-specific conversion enforcement.
7. Global conversion handling.
8. Granite measured-material PO.
9. Marble measured-material PO.
10. Expected measurement handling.
11. Historical conversion snapshot.
12. Product conversion changes after PO creation.
13. Organization isolation.
14. Supplier validation.
15. Branch validation.
16. Approved PR conversion.
17. PO status transitions.
18. GRN receiving against PO.
19. Partial receiving.
20. Full receiving.
21. Over-receipt validation.
22. Tax and discount calculations.
23. Monetary rounding.
24. Existing PO compatibility.

Frontend tests should verify:

25. Normal PO row remains simple.
26. Alternate pricing appears only when valid.
27. Invalid pricing unit cannot be selected.
28. Granite displays measured-material fields.
29. Normal products do not display granite fields.
30. PR conversion populates items correctly.
31. Additional details remain secondary.
32. Calculated totals are displayed correctly.

============================================================
PART 44 — MIGRATION SAFETY
============================================================

If restructuring the database:

DO NOT:

    drop existing fields immediately
    destroy existing data
    rewrite historical PO values
    alter historical calculations

Use staged migrations where necessary.

If a field is replaced:

    old field
        ↓
    data migration
        ↓
    new field
        ↓
    application switch
        ↓
    old field removal only when safe

============================================================
PART 45 — DELIVERABLES
============================================================

Before implementation, provide:

1. Current PO architecture analysis.
2. Current PO UI complexity analysis.
3. Current Unit/UOM architecture analysis.
4. Current Unit Conversion architecture analysis.
5. Current PO Item schema analysis.
6. Current GRN relationship analysis.
7. Current Inventory relationship analysis.
8. Problems with Order Unit vs Pricing Unit.
9. Recommended simplified domain model.
10. Recommended Product Unit configuration.
11. Recommended Purchase Order data model.
12. Recommended measured-material model.
13. Recommended database migrations.
14. Recommended React UX.
15. Recommended backend service architecture.
16. Conversion validation rules.
17. Historical snapshot strategy.
18. GRN integration strategy.
19. Inventory integration strategy.
20. Testing strategy.

ONLY AFTER THIS ANALYSIS:

Implement the required changes.

============================================================
FINAL ARCHITECTURAL MODEL
============================================================

The target architecture should conceptually be:

PRODUCT
│
▼
PRODUCT UNIT CONFIGURATION
│
├── Valid Units
│
└── Fixed Conversions
│
▼
PURCHASE ORDER
│
├── Standard Product
│ Quantity + Unit + Rate
│
└── Measured Material
Slab/Unit Quantity +
Measurement-based Price
│
▼
GRN
│
├── Standard Receipt
│
└── Actual Measurements
│
▼
INVENTORY

The Purchase Order should consume product configuration.

The Purchase Order must NOT become a unit-conversion configuration screen.

The GRN must determine actual variable measurements.

The Inventory system must preserve the physical stock reality.

The final user experience should be:

    Select Supplier
          ↓
    Select Products
          ↓
    Enter Quantity
          ↓
    Select Unit
          ↓
    Enter Rate
          ↓
    Review Total
          ↓
    Save/Submit PO

For normal products, that is all the user should need.

Advanced unit conversion should appear only when the product configuration supports it.

Measured-material complexity should appear only for products such as granite and marble.

Do not over-engineer the solution.
Do not introduce a Workflow Engine.
Do not introduce a new Accounting Engine.
Do not introduce a new UOM Engine if the existing architecture can be refactored safely.

The goal is:

SIMPLER USER EXPERIENCE

- CORRECT DOMAIN MODEL
- AUDITABLE PURCHASE DATA
- CORRECT GRN/INVENTORY INTEGRATION.
