You are the Lead ERP Architect, Senior Laravel Architect, Senior React Architect, PostgreSQL Architect, Procurement Domain Expert, Inventory Domain Expert, and Unit-of-Measure (UOM) Specialist.

You are working on an EXISTING multi-tenant ERP system for:

- Tiles
- Sanitaryware
- Granite
- Marble
- Other building and finishing materials

This is NOT a greenfield project.

The system already contains:

- Organizations
- Branches
- RBAC
- Suppliers
- Products
- Product Variants
- Categories
- Units of Measure
- Unit conversions
- Purchase Requisitions
- Purchase Orders
- Purchase Order Items
- GRN
- Inventory Objects
- Inventory Movements
- Accounting foundation
- React frontend
- Laravel backend

Purchase Order implementation has already been designed/implemented since prompt17 (app/docs/prompts).

============================================================
PRIMARY OBJECTIVE
============================================================

Review and refine the Purchase Order architecture so that it correctly handles products with different purchasing, packaging, conversion, pricing, and physical-measurement characteristics.

The system MUST correctly support at least these scenarios:

1. Tiles purchased by BOX and converted to PCS.
2. Tiles purchased by PCS where appropriate.
3. Sanitaryware purchased by PCS.
4. Granite purchased as SLABS but priced by SQ.FT.
5. Marble purchased as SLABS but priced by SQ.FT.
6. Future products with packaging conversions.
7. Future products whose price is based on a physical measurement rather than the number of physical objects.

============================================================
MOST IMPORTANT ARCHITECTURAL DECISION
============================================================

DO NOT force every product into a universal UI containing:

- Order Unit
- Pricing Unit
- Rate Basis

Those terms may be technically valid but are unnecessarily confusing for ordinary products.

The UI and domain model must reflect the REAL BUSINESS BEHAVIOR of the product.

The system should primarily distinguish between:

A. NORMAL / COUNTABLE / PACKAGED PRODUCTS

and

B. MEASURED / INDIVIDUALLY MEASURED PRODUCTS

Examples:

NORMAL:

- Tiles
- Sanitaryware
- Faucets
- Wash basins
- WC sets
- Boxes
- Pieces

MEASURED:

- Granite slabs
- Marble slabs
- Other natural stone slabs
- Future products whose actual physical measurement determines value

============================================================
PART 1 — STUDY EXISTING ARCHITECTURE FIRST
============================================================

Before changing anything, inspect the existing codebase and migrations.

Specifically inspect:

1. Units of Measure
2. Product-unit relationships
3. Product variants
4. Unit conversion tables
5. Product categories/types
6. Purchase Requisitions
7. Purchase Requisition Items
8. Purchase Orders
9. Purchase Order Items
10. Suppliers
11. GRN
12. GRN Items
13. Inventory Objects
14. Inventory Movements
15. Granite slab implementation
16. Marble implementation, if already present
17. Tax architecture
18. Accounting architecture
19. Existing PurchaseOrderService
20. Existing GRNService
21. Existing React Purchase Order UI

DO NOT create a second UOM system.

DO NOT create a second conversion system.

DO NOT create product-specific conversion logic if the existing UOM architecture can express the rule.

First determine what the current architecture already supports.

============================================================
PART 2 — NORMAL / COUNTABLE PRODUCTS
============================================================

For normal products, the basic purchasing model should remain simple:

Quantity

- Unit
- Unit Price
- Amount

Example:

Product:
600 × 600 Tile

Quantity:
100

Unit:
BOX

Unit Price:
₹800 / BOX

Amount:
₹80,000

The user should NOT need to understand:

"pricing unit"

or

"rate basis"

in the normal case.

The UI should simply show:

Product | Quantity | Unit | Rate | Amount

============================================================
PART 3 — PACKAGING AND UNIT CONVERSION
============================================================

The UOM system must support relationships such as:

1 BOX = 4 PCS

Example:

Product:
600 × 600 Tile

Base inventory unit:
PCS

Packaging unit:
BOX

Conversion:

1 BOX = 4 PCS

Supplier price:

₹800 / BOX

If the PO is:

100 BOX

then:

Commercial quantity:
100 BOX

Inventory-equivalent quantity:
400 PCS

The original commercial quantity MUST be preserved.

Do NOT replace:

100 BOX

with:

400 PCS

in the Purchase Order.

The PO is a commercial document and must preserve the unit in which the purchase was made.

============================================================
PART 4 — PURCHASING IN A DIFFERENT UNIT
============================================================

The system should also consider the case where a user wants to purchase a product in a unit different from its usual packaging unit.

Example:

Product:
Tile

Configured:

1 BOX = 4 PCS

Supplier normally sells:

BOX

But the organization wants:

20 PCS

The system should determine whether the supplier permits this.

If open-box purchase is permitted:

20 PCS may be ordered.

If supplier only sells full boxes:

20 PCS requires:

5 BOX = 20 PCS

If the user requests:

21 PCS

the system should detect:

21 / 4 = 5.25 BOX

and determine, according to the configured purchasing rules, whether:

A. Partial box is allowed

or

B. The order must be rounded to 6 BOX = 24 PCS

The system must NOT silently round quantities.

The user must be informed of the consequence.

============================================================
PART 5 — SUPPLIER-SPECIFIC PURCHASING
============================================================

Review whether the current architecture supports supplier-specific:

- Purchase unit
- Packaging unit
- Minimum order quantity
- Price
- Conversion
- Purchase constraints

Do NOT assume that every supplier sells a product in exactly the same way.

Example:

Supplier A:

Tile
1 BOX = 4 PCS
₹800 / BOX

Supplier B:

Tile
1 BOX = 2 PCS
₹450 / BOX

If the current architecture cannot safely support supplier-specific packaging/conversion, identify this as a future requirement rather than creating an unsafe implementation.

The product's generic UOM definition must not be corrupted to represent one supplier's packaging.

============================================================
PART 6 — GRANITE / MARBLE ARE DIFFERENT
============================================================

Granite and marble slabs MUST NOT be treated like BOX → PCS conversions.

Example:

Granite:

10 SLABS

Price:

₹180 / SQ.FT.

There is NO fixed conversion:

1 SLAB = X SQ.FT.

because every slab can have a different area.

Example:

Slab 1 = 18.4 SQ.FT.
Slab 2 = 21.2 SQ.FT.
Slab 3 = 17.9 SQ.FT.

Therefore:

DO NOT create a permanent product conversion:

1 SLAB = 20 SQ.FT.

DO NOT use a fixed conversion factor for granite/marble slabs.

============================================================
PART 7 — GRANITE PO REPRESENTATION
============================================================

At Purchase Order stage, represent granite approximately as:

Product:
Black Granite

Quantity:
10

Unit:
SLAB

Rate:
₹180 / SQ.FT.

The user should understand:

"I am ordering 10 slabs, but the supplier charges according to the actual area."

The system must NOT calculate:

10 × ₹180

because that is mathematically meaningless.

The actual monetary amount depends on actual slab area.

============================================================
PART 8 — OPTIONAL EXPECTED AREA
============================================================

The supplier may sometimes provide an estimated/expected area.

Example:

10 slabs

Expected area:
200 SQ.FT.

Rate:
₹180 / SQ.FT.

Estimated value:

# 200 × ₹180

₹36,000

If expected area is supplied, the system may show:

Estimated Amount:
₹36,000

But this MUST be explicitly identified as:

ESTIMATED

It must NOT be treated as the final inventory valuation or final supplier liability.

If expected area is not known:

Display:

Amount:
Pending actual measurement

Do NOT calculate:

10 × ₹180

============================================================
PART 9 — GRANITE GRN
============================================================

Actual slab measurement belongs to GRN.

When granite physically arrives:

GRN records each slab individually.

Example:

Slab 1:
Length = 8.2 ft
Width = 3.1 ft
Area = 25.42 SQ.FT.

Slab 2:
Length = 7.8 ft
Width = 3.0 ft
Area = 23.40 SQ.FT.

...

The system calculates:

Total received slabs

- Total actual area

Example:

10 slabs
193.60 SQ.FT.

The actual value can then be calculated:

# 193.60 × ₹180

₹34,848

============================================================
PART 10 — GRANITE INVENTORY
============================================================

Each granite slab must remain an individually identifiable inventory object according to the existing inventory architecture.

Each inventory object must preserve:

- Slab identity
- Product variant
- Warehouse
- Storage location
- Quantity/count = 1 slab
- Actual area
- Dimensions where applicable
- Object code
- Batch/reference information
- Status

The system MUST NOT reduce:

10 slabs / 193.60 SQ.FT.

to:

193.60 SQ.FT.

and lose slab identity.

Both concepts are required:

SLAB COUNT

- ACTUAL AREA

============================================================
PART 11 — MARBLE
============================================================

Apply the same architecture to marble where marble is physically received as individual slabs.

Example:

PO:

20 SLABS

Rate:

₹250 / SQ.FT.

GRN:

Slab 1 = 19.4 SQ.FT.
Slab 2 = 21.1 SQ.FT.
...

Inventory:

One inventory object per slab.

Again:

DO NOT create a fixed:

1 SLAB = X SQ.FT.

conversion.

============================================================
PART 12 — PURCHASE ORDER UI
============================================================

The Purchase Order UI must remain simple for normal products.

NORMAL PRODUCT:

Product:
600 × 600 Tile

Quantity:
[100]

Unit:
[BOX]

Rate:
[₹800 / BOX]

Amount:
₹80,000

Do NOT show unnecessary technical fields.

---

GRANITE / MARBLE:

Product:
Black Granite

Quantity:
[10]

Unit:
[SLAB]

Rate:
[₹180 / SQ.FT.]

Expected Area:
[Optional]

Amount:

If expected area is empty:

"Pending actual measurement"

If expected area = 200:

"Estimated: ₹36,000"

Clearly label the value as estimated.

============================================================
PART 13 — DO NOT EXPOSE INTERNAL UOM COMPLEXITY
============================================================

The database may need to maintain multiple concepts.

The UI should not expose all of them.

For example:

Internal system may know:

- base unit
- purchase unit
- conversion
- inventory unit
- pricing basis
- measurement type

But the ordinary PO user should see:

Product
Quantity
Unit
Rate
Amount

Only show additional fields when required by the product's purchasing behavior.

This is a UX requirement.

============================================================
PART 14 — PRODUCT CONFIGURATION
============================================================

Do NOT hard-code:

if product == GRANITE

throughout the code.

Instead, the product/variant/category architecture should identify whether a product is:

COUNTABLE/PACKAGED

or

MEASURED/INDIVIDUALLY_MEASURED

Use the existing product architecture if it already provides an equivalent concept.

If it does not, propose a clean generic mechanism.

Do not create unnecessary product-specific flags.

The architecture should eventually support:

Tile:
BOX → PCS

Sanitaryware:
PCS → PCS

Granite:
SLAB + actual SQ.FT.

Marble:
SLAB + actual SQ.FT.

Other products:
appropriate UOM behavior

============================================================
PART 15 — IMPORTANT DISTINCTION: CONVERSION VS MEASUREMENT
============================================================

This distinction MUST be documented in the code and system design.

FIXED CONVERSION:

1 BOX = 4 PCS

This is a deterministic UOM conversion.

PHYSICAL MEASUREMENT:

1 SLAB = actual measured area

This is NOT a deterministic UOM conversion.

Example:

Slab A = 18.4 SQ.FT.
Slab B = 21.2 SQ.FT.

Therefore:

BOX → PCS

can use a conversion factor.

SLAB → SQ.FT.

for granite/marble must use actual measurement.

============================================================
PART 16 — PURCHASE ORDER TOTALS
============================================================

The backend must be the authoritative source for monetary calculations.

Normal products:

Quantity × Unit Price

Example:

# 100 BOX × ₹800/BOX

₹80,000

Granite/marble:

Actual/expected area × Rate

Example:

Expected:
200 SQ.FT. × ₹180
=
₹36,000 estimated

Actual GRN:

# 193.60 SQ.FT. × ₹180

₹34,848 actual goods value

The system must distinguish:

PO estimated value
GRN actual value
Supplier invoice value

Do not assume these are always identical.

============================================================
PART 17 — PO → GRN RECEIVING
============================================================

For normal products, track receiving using the PO's commercial unit.

Example:

PO:
100 BOX

GRN #1:
60 BOX

Remaining:
40 BOX

PO status:
PARTIALLY_RECEIVED

GRN #2:
40 BOX

Remaining:
0 BOX

PO status:
FULLY_RECEIVED

For granite:

PO:
10 SLABS

GRN:
8 SLABS

Remaining:
2 SLABS

Separately:

Actual received area:
153.8 SQ.FT.

Do NOT replace:

8 SLABS

with:

153.8 SQ.FT.

Both values must be preserved.

============================================================
PART 18 — PARTIAL RECEIPT
============================================================

Partial receipt must work for:

- Tiles
- Sanitaryware
- Granite
- Marble
- Other products

For granite/marble, partial receipt may have a different total area from the remaining expected area.

Example:

PO:
10 slabs

GRN #1:
4 slabs
75.6 SQ.FT.

Remaining:
6 slabs

GRN #2:
6 slabs
118.0 SQ.FT.

Total:
10 slabs
193.6 SQ.FT.

The system must preserve each GRN's actual measurements.

============================================================
PART 19 — OVER-RECEIPT
============================================================

Review the existing over-receipt policy.

DO NOT use free-text remarks as authorization.

Never implement:

"approved over-receipt"

as a security mechanism.

If:

ALLOW_WITH_APPROVAL

is supported, use an explicit authorization mechanism.

For example:

purchase.over_receipt.approve

or an equivalent existing RBAC mechanism.

Do NOT introduce the Workflow Engine for this task.

Keep the domain extensible so a Workflow Engine can be introduced later.

============================================================
PART 20 — TAX AND DISCOUNT
============================================================

Review the existing tax architecture before changing anything.

Do not create duplicate tax configuration.

Tax and discount calculations must be applied to the correct monetary amount.

For normal products:

Quantity × Unit Price
→ Discount
→ Tax

For measured products:

Actual/estimated measured quantity × Rate
→ Discount
→ Tax

Store transaction-level calculated values where required for historical accuracy.

============================================================
PART 21 — ACCOUNTING COMPATIBILITY
============================================================

Review the existing Accounting architecture.

Do not implement accounting posting prematurely if the accounting workflow is not yet ready.

However, the PO and GRN data model must preserve sufficient information for future:

- inventory valuation
- supplier invoice matching
- accounts payable
- purchase price variance
- tax accounting

Do not design accounting around the assumption that:

quantity × price

always produces the final value.

============================================================
PART 22 — SUPPLIER INVOICE COMPATIBILITY
============================================================

The future supplier invoice process must be capable of handling:

Normal:

PO:
100 BOX × ₹800

GRN:
100 BOX

Invoice:
100 BOX × ₹800

Granite:

PO:
10 SLABS
₹180 / SQ.FT.

GRN:
10 SLABS
193.60 SQ.FT.

Invoice:
193.60 SQ.FT. × ₹180

The architecture must preserve the original PO quantity and the actual GRN measurement.

============================================================
PART 23 — DATABASE REVIEW
============================================================

Before creating migrations, determine:

A. What UOM fields already exist?

B. What conversion fields already exist?

C. What product-unit relationships already exist?

D. What purchase_order_items fields already exist?

E. What GRN item fields already exist?

F. What inventory object fields already exist?

G. What granite-specific fields already exist?

H. What fields are actually missing?

DO NOT add:

purchase_unit_id
pricing_unit_id
rate_basis
conversion_factor

merely because they appear conceptually useful.

First verify whether existing structures already provide the same information.

Avoid duplicate representations of the same business concept.

============================================================
PART 24 — BACKWARD COMPATIBILITY
============================================================

If Prompt 17 has already modified the Purchase Order implementation:

DO NOT discard it.

Review the implementation and produce a safe refactoring/migration plan.

Existing ordinary products must continue working.

Existing POs must remain readable and valid.

If new fields are required:

- provide safe defaults
- migrate existing records
- preserve existing values
- avoid destructive changes

============================================================
PART 25 — API
============================================================

Review existing PO APIs.

The client should submit only the business information it actually needs to provide.

For normal products:

- product_variant_id
- quantity
- unit
- unit_price
- discount information
- tax information where applicable

For measured products:

- product_variant_id
- number of slabs/physical units
- applicable rate
- optional expected area

The backend must:

- validate UOM
- validate conversions
- calculate authoritative totals
- validate pricing
- enforce organization isolation
- enforce product configuration
- reject invalid combinations

Never trust calculated totals sent from React.

============================================================
PART 26 — REACT UX
============================================================

The Purchase Order UI must dynamically adapt to the product.

NORMAL PRODUCT:

Show:

Product
Quantity
Unit
Rate
Amount

GRANITE/MARBLE:

Show:

Product
Number of Slabs
Unit = SLAB
Rate = ₹ / SQ.FT.
Expected Area (optional)
Estimated Amount / Pending Measurement

Do not expose unnecessary UOM internals.

Use clear labels understandable to warehouse/purchase staff.

============================================================
PART 27 — VALIDATION
============================================================

Normal products:

- quantity > 0
- valid unit
- valid conversion where required
- unit price >= 0
- valid product/unit relationship

Granite/marble:

- slab quantity > 0
- slab unit must be SLAB or equivalent configured unit
- rate must be associated with SQ.FT. or the configured area unit
- expected area, if supplied, must be > 0
- individual slab dimensions are NOT required at PO stage
- individual slab dimensions ARE required at GRN where applicable
- actual slab area must be > 0

============================================================
PART 28 — TESTING
============================================================

Create/update tests for:

1. Tile purchased in BOX.
2. Tile converted BOX → PCS.
3. Tile purchased directly in PCS where permitted.
4. Tile purchase in PCS when supplier only permits BOX.
5. Invalid partial-box order is rejected when partial boxes are not allowed.
6. Sanitaryware purchased in PCS.
7. Granite purchased as SLABS.
8. Granite priced per SQ.FT.
9. Granite PO does not require slab dimensions.
10. Granite PO does not calculate:
    slab_count × sq.ft_rate
11. Granite expected area produces an ESTIMATED value.
12. Granite without expected area shows pending measurement.
13. Granite GRN captures actual slab dimensions.
14. Granite GRN calculates actual area.
15. Granite inventory preserves:
    slab identity
    slab count
    actual area
16. Marble follows the same measured-material architecture.
17. Partial granite receipt works.
18. Full granite receipt works.
19. Actual area is preserved per GRN.
20. PO remaining quantity remains in slabs.
21. Over-receipt cannot be authorized through remarks.
22. Invalid UOM combinations are rejected.
23. Backend recalculates monetary values.
24. Organization isolation is enforced.
25. Existing ordinary POs continue working.

============================================================
PART 29 — DOCUMENTATION
============================================================

Update the ERP technical documentation to explicitly explain:

1. What is a UOM?
2. What is a fixed unit conversion?
3. What is a packaging unit?
4. What is a base/inventory unit?
5. What is a physical measurement?
6. Why BOX → PCS is a conversion.
7. Why SLAB → SQ.FT. is NOT a fixed conversion for granite.
8. Why granite measurement occurs at GRN.
9. How PO quantity differs from actual received measurement.
10. How PO value differs from actual GRN value.
11. How the system handles partial receipts.

Use business examples from:

- Tiles
- Sanitaryware
- Granite
- Marble

============================================================
PART 30 — OUTPUT FORMAT
============================================================

Return the analysis in this exact order:

1. Existing UOM Architecture Review
2. Existing Product/Variant Architecture Review
3. Existing Purchase Order Architecture Review
4. Existing GRN Architecture Review
5. Existing Inventory Architecture Review
6. Problems Found in Current Implementation
7. Recommended UOM Architecture
8. Normal Product Purchasing Model
9. Packaging & Conversion Model
10. Granite/Marble Measured-Material Model
11. Purchase Order Data Model
12. GRN Data Model
13. Inventory Data Model
14. Pricing Calculation Model
15. PO UI/UX Design
16. Granite/Marble UI/UX Design
17. PO → GRN Flow
18. Partial Receipt Design
19. Over-Receipt Design
20. Tax & Discount Design
21. Accounting Compatibility
22. Supplier Invoice Compatibility
23. Required Database Changes
24. Required Backend Changes
25. Required API Changes
26. Required React Changes
27. Migration/Refactoring Plan
28. Automated Test Plan
29. Documentation Updates
30. Final Architecture

============================================================
FINAL ARCHITECTURAL RULES
============================================================

1. DO NOT force every product into Order Unit + Pricing Unit terminology.

2. For ordinary products, use the simple business model:

    Quantity + Unit + Rate + Amount

3. Use the existing UOM conversion system for deterministic relationships such as:

    1 BOX = 4 PCS

4. Preserve the original commercial purchasing quantity.

5. Do not silently convert a PO from BOX to PCS and lose the commercial unit.

6. Do not silently round quantities.

7. For granite/marble, do NOT create a fixed:

    1 SLAB = X SQ.FT.

    conversion.

8. Granite/marble slabs are individually measured physical objects.

9. Granite/marble PO quantity is expressed in SLABS.

10. Granite/marble price is expressed per area, such as SQ.FT.

11. Actual granite/marble area is determined at GRN.

12. Granite/marble inventory must preserve both:

    slab identity/count
    - actual area

13. PO estimated value and GRN actual value are different concepts.

14. Do not calculate granite PO value from slab count alone.

15. Do not require slab dimensions at PO creation.

16. Do not expose unnecessary UOM complexity in the React UI.

17. Do not duplicate the existing UOM/conversion architecture.

18. Do not introduce a Workflow Engine for this task.

19. Use RBAC and domain services for current authorization.

20. Keep the architecture extensible for future configurable workflows.

21. organization_id MUST never be accepted from the client.

22. Backend must be authoritative for conversions, validation, and monetary calculations.

23. Do not implement product-specific hard-coded conversion logic when a generic architecture can support the requirement.

24. The final design must support tiles, sanitaryware, granite, marble, and future building-material categories without redesigning the purchasing architecture.
