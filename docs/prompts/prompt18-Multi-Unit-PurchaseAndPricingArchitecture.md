You are the Lead ERP Architect, Senior Laravel Architect, Senior React Architect, Database Architect, Procurement Domain Expert, Inventory Domain Expert, and ERP Unit-of-Measure (UOM) Specialist.

You are working on an EXISTING Tiles, Sanitary, Granite & Marble ERP system.

This is NOT a greenfield project.

The system already contains:

- Multi-tenant organization architecture
- Organization and branch management
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

Purchase Order implementation has already been planned/implemented through Prompt 17.

====================================================
OBJECTIVE
====================================================

Review and rectify the Purchase Order implementation so that it correctly supports products whose:

1. Purchase quantity unit
2. Pricing unit
3. Inventory unit
4. Physical measurement unit

may be different.

This is especially important for:

- Granite
- Marble
- Other natural stone slabs
- Tiles
- Sanitaryware
- Any future products with non-identical purchasing and pricing units

DO NOT assume:

quantity × unit_price

always uses the same unit.

====================================================
CORE BUSINESS PRINCIPLE
====================================================

The ERP MUST distinguish between:

A. PURCHASE QUANTITY

How many commercial units were ordered.

B. PURCHASE UNIT

The unit in which the supplier sells/provides the item.

C. PRICING BASIS / PRICING UNIT

The unit against which the supplier charges.

D. INVENTORY UNIT

The unit in which the ERP maintains inventory.

E. PHYSICAL MEASUREMENT

The actual physical measurement captured when goods are received, where applicable.

These concepts MUST NOT be conflated.

====================================================
EXAMPLES
====================================================

Example 1 — Tiles

Product:
600 × 600 mm Tile

Purchase:

100 BOX

1 BOX = 4 PCS

Price:

₹800 / BOX

Therefore:

Purchase Quantity = 100
Purchase Unit = BOX
Pricing Unit = BOX
Unit Price = ₹800

Commercial value:

100 × ₹800 = ₹80,000

Inventory may internally represent:

100 BOX = 400 PCS

Do not lose the original purchasing unit.

---

Example 2 — Sanitaryware

Product:
Wash Basin

Purchase:

20 PCS

Price:

₹2,500 / PCS

Therefore:

Purchase Quantity = 20
Purchase Unit = PCS
Pricing Unit = PCS
Unit Price = ₹2,500

Commercial value:

20 × ₹2,500 = ₹50,000

---

Example 3 — Granite

Product:
Black Granite

Purchase:

10 SLABS

Price:

₹180 / SQ.FT.

Therefore:

Purchase Quantity = 10
Purchase Unit = SLAB
Pricing Unit = SQ.FT.
Unit Price = ₹180 / SQ.FT.

IMPORTANT:

10 slabs × ₹180 is INVALID.

The total value cannot be accurately calculated from the PO quantity alone because the actual area of each slab is unknown at PO creation.

The actual area becomes known during GRN.

---

Example 4 — Marble

Product:
White Marble

Purchase:

20 SLABS

Price:

₹250 / SQ.FT.

Again:

Purchase Quantity = 20 SLABS
Pricing Unit = SQ.FT.

Actual slab dimensions and area are captured during GRN.

====================================================
PART 1 — STUDY EXISTING ARCHITECTURE FIRST
====================================================

Before modifying anything, inspect the existing codebase and migrations for:

- units
- product units
- product variants
- unit conversions
- purchase_order_items
- purchase_orders
- GRN items
- inventory_objects
- granite slab handling
- marble handling
- product categories/types
- pricing
- tax
- accounting

DO NOT create a second UOM or conversion system.

Reuse the existing unit architecture wherever possible.

Determine whether the existing schema can already represent:

purchase unit
pricing unit
inventory/base unit

If it can, use it.

If it cannot, propose the minimum required schema changes.

====================================================
PART 2 — DEFINE UNIT ROLES
====================================================

Establish clear terminology throughout the codebase.

The following concepts should be represented distinctly:

Purchase Quantity
Purchase Unit
Pricing Unit
Unit Price
Base/Inventory Unit
Conversion Factor
Actual Received Quantity
Actual Received Area

Do not use ambiguous names such as:

quantity
unit
price

without understanding what they represent.

Where existing field names are ambiguous, determine whether they should be renamed, supplemented, or documented.

Do NOT rename existing production fields blindly.

====================================================
PART 3 — PURCHASE ORDER ITEM MODEL
====================================================

Review the existing purchase_order_items table.

Determine whether it needs to represent something conceptually equivalent to:

ordered_quantity
purchase_unit_id
pricing_unit_id
unit_price

Potentially:

conversion_factor

if required by the existing UOM architecture.

Do NOT automatically add these exact columns.

First determine whether equivalent concepts already exist.

The final model must support:

---

## Tiles

ordered_quantity = 100
purchase_unit = BOX
pricing_unit = BOX
unit_price = 800

---

## Sanitaryware

ordered_quantity = 20
purchase_unit = PCS
pricing_unit = PCS
unit_price = 2500

---

## Granite

ordered_quantity = 10
purchase_unit = SLAB
pricing_unit = SQ.FT.
unit_price = 180

====================================================
PART 4 — GRANITE/MARBLE TOTAL CALCULATION
====================================================

This is CRITICAL.

For granite/marble:

At PO creation:

10 SLABS
₹180 / SQ.FT.

The system MUST NOT calculate:

10 × 180

as the total.

Instead the PO must distinguish between:

ORDERED QUANTITY
and
ESTIMATED/UNKNOWN PRICING QUANTITY.

Possible states:

A. Actual area unknown

Display:

10 SLABS
₹180 / SQ.FT.
Amount: Pending actual receipt measurement

B. Estimated area known

If the supplier quotation specifies:

Expected Area = 200 SQ.FT.

Then:

Estimated Amount = 200 × ₹180 = ₹36,000

This must be clearly marked as an estimate.

C. Actual area known

Only after GRN:

Actual Area = 193.6 SQ.FT.

Actual goods value:

193.6 × ₹180 = ₹34,848

The system must distinguish:

estimated amount
from
actual received value

====================================================
PART 5 — GRANITE/MARBLE GRN INTEGRATION
====================================================

At PO stage:

Capture:

- number of slabs ordered
- pricing unit
- price per pricing unit
- optional expected area

DO NOT capture individual slab dimensions as mandatory PO information.

At GRN:

Capture individual slabs:

Slab 1:
length
width
area

Slab 2:
length
width
area

...

Each slab becomes an individual inventory object according to the existing inventory architecture.

Calculate:

actual slab count
actual total area

The GRN must be able to compare:

PO slab quantity
vs
received slab quantity

and:

expected area
vs
actual area

where expected area exists.

====================================================
PART 6 — GRANITE INVENTORY VALUATION
====================================================

Review how inventory valuation currently works.

For granite/marble:

The physical inventory object should contain the actual slab area.

Example:

Inventory Object:

Slab GRN-001-01
Quantity = 1 SLAB
Area = 18.72 SQ.FT.

The valuation should be capable of using:

18.72 SQ.FT. × purchase rate

where appropriate.

Do NOT force the entire inventory system to treat the slab as merely:

quantity = 1

and lose the area.

The system must preserve both:

slab count
and
area.

====================================================
PART 7 — PURCHASE ORDER UI
====================================================

Modify the React Purchase Order form to dynamically display the correct purchasing and pricing behavior.

---

## NORMAL PRODUCT

Product:
Tile

Quantity:
[ 100 ]

Purchase Unit:
[ BOX ]

Pricing Unit:
[ BOX ]

Unit Price:
[ ₹800 ]

Amount:
₹80,000

---

## GRANITE/MARBLE

Product:
Black Granite

Quantity:
[ 10 ]

Purchase Unit:
[ SLAB ]

Pricing Unit:
[ SQ.FT. ]

Unit Price:
[ ₹180 ]

Expected Area:
[ Optional ]

Amount:

[ Pending actual area ]

OR

if expected area is entered:

Expected Area:
200 SQ.FT.

Estimated Amount:
₹36,000

Clearly label it:

"Estimated"

Do NOT show a misleading total based on slab count.

====================================================
PART 8 — PRODUCT CONFIGURATION
====================================================

Do NOT hard-code:

if product == granite

throughout the application.

The system should use product configuration/category/type and UOM capabilities.

The architecture should support future examples such as:

Granite:
SLAB → SQ.FT.

Marble:
SLAB → SQ.FT.

Tiles:
BOX → BOX

Tiles:
BOX → SQ.FT. (if commercially required)

Sanitaryware:
PCS → PCS

Steel:
KG → KG

Cable:
ROLL → METER

The system must therefore support:

purchase unit ≠ pricing unit

without product-specific hacks.

====================================================
PART 9 — UNIT CONVERSION
====================================================

Review the existing conversion system.

There are potentially different conversion concepts:

1. Commercial conversion

BOX → PCS

2. Measurement conversion

SQ.M. → SQ.FT.

3. Physical measurement

SLAB → actual SQ.FT.

Do NOT treat all three as the same conversion.

Especially:

SLAB → SQ.FT.

for granite is NOT a fixed conversion factor.

Each slab has its own physical area.

Example:

Slab A = 18.4 SQ.FT.
Slab B = 21.1 SQ.FT.
Slab C = 17.8 SQ.FT.

Therefore:

DO NOT create:

1 SLAB = X SQ.FT.

as a permanent product conversion for granite.

====================================================
PART 10 — PO → GRN RECEIVING
====================================================

The system must track:

Ordered Quantity
Received Quantity
Remaining Quantity

using the purchase unit.

Example:

PO:

100 BOX

GRN #1:

60 BOX

Remaining:

40 BOX

PO status:

PARTIALLY_RECEIVED

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

The system must preserve both:

8 SLABS
153.8 SQ.FT.

Do not replace slab quantity with area.

====================================================
PART 11 — OVER-RECEIPT
====================================================

Review the existing over-receipt policy.

Do NOT authorize over-receipt through free-text remarks.

Never implement:

"approved over-receipt"

as a security mechanism.

Use:

- RBAC permission
- explicit approval action
- or future workflow integration

For now, if a simple permission model is appropriate:

purchase.over_receipt.approve

may be used.

Keep the architecture extensible for a future Workflow Engine.

====================================================
PART 12 — TAX AND DISCOUNT
====================================================

Review the existing tax profile architecture.

Do not duplicate tax configuration.

Tax calculation must understand the pricing basis.

For example:

Granite:

Actual Area × Rate = taxable line value

Tiles:

Boxes × Rate = line value

Discounts and taxes must be calculated against the correct monetary basis.

Store transaction-level tax/discount results so historical transactions do not change when master tax configuration changes.

====================================================
PART 13 — ACCOUNTING IMPLICATIONS
====================================================

Review the existing accounting architecture.

Do not create accounting entries prematurely if the current accounting workflow is not yet ready.

However, ensure the PO model provides enough information for future:

- purchase valuation
- supplier invoice matching
- GRN valuation
- accounts payable
- purchase price variance

The architecture must not assume that:

quantity × unit price

is always sufficient.

====================================================
PART 14 — SUPPLIER INVOICE MATCHING
====================================================

Ensure the future design can support:

PO
↓
GRN
↓
Supplier Invoice

For granite/marble:

PO:
10 slabs
₹180 / SQ.FT.

GRN:
10 slabs
193.6 SQ.FT.

Invoice:
193.6 SQ.FT. × ₹180

The system should be capable of matching based on:

- ordered slab count
- actual received slab count
- actual received area
- pricing unit
- unit rate

without losing the original PO information.

====================================================
PART 15 — DATA INTEGRITY
====================================================

Enforce:

- purchase quantity > 0
- unit price >= 0
- purchase unit must be valid for product
- pricing unit must be valid
- pricing unit must be compatible with product pricing configuration
- conversion must exist where fixed conversion is applicable
- granite/marble slab area must be captured at GRN
- slab count must match received slab objects
- actual area must be positive
- organization isolation must be enforced

Do not trust calculated monetary totals supplied by React.

Backend must calculate authoritative values.

====================================================
PART 16 — API DESIGN
====================================================

Review existing Purchase Order APIs.

The client may submit:

- product_variant_id
- ordered_quantity
- purchase_unit_id
- pricing_unit_id
- unit_price
- optional expected_area
- discount information
- tax information where appropriate

But:

- organization_id MUST NOT come from client
- authoritative conversions must be determined by backend
- authoritative totals must be calculated by backend
- pricing rules must be validated by backend

====================================================
PART 17 — DATABASE CHANGES
====================================================

Before creating migrations:

1. Review all existing UOM tables.
2. Review product-unit relationships.
3. Review conversion tables.
4. Review purchase_order_items.
5. Review GRN items.
6. Review inventory_objects.

Then produce:

A. Fields already available

B. Fields that are missing

C. Fields that should be added

D. Fields that should NOT be added because an existing structure already provides the concept

Do NOT duplicate data unnecessarily.

====================================================
PART 18 — BACKWARD COMPATIBILITY
====================================================

If Prompt 17 has already been implemented:

DO NOT discard the implementation.

Create a migration/refactoring strategy.

Existing ordinary products such as:

Tiles
Sanitaryware

must continue working.

Existing POs must not become invalid merely because pricing-unit support is introduced.

Define safe defaults/migrations for existing records.

====================================================
PART 19 — TESTING
====================================================

Create/update tests for at least:

1. Tile purchased in BOX and priced per BOX.
2. Tile purchased in BOX and converted to PCS for inventory.
3. Sanitary item purchased in PCS and priced per PCS.
4. Granite purchased in SLABS and priced per SQ.FT.
5. Marble purchased in SLABS and priced per SQ.FT.
6. Granite PO does not require slab dimensions.
7. Granite PO does not calculate amount as slab_count × sq.ft_rate.
8. Granite GRN captures individual slab dimensions.
9. Granite GRN calculates actual area.
10. Granite inventory objects preserve slab count and area.
11. PO remaining quantity is tracked in purchase units.
12. Actual received area is tracked separately.
13. Partial granite receipt works correctly.
14. Full granite receipt works correctly.
15. Over-receipt is rejected under STRICT policy.
16. Over-receipt requires explicit authorization under ALLOW_WITH_APPROVAL.
17. No free-text remark can authorize over-receipt.
18. Invalid purchase units are rejected.
19. Invalid pricing units are rejected.
20. Organization isolation is enforced.
21. Backend recalculates all monetary totals.
22. Existing ordinary POs remain functional after migration.

====================================================
PART 20 — OUTPUT FORMAT
====================================================

Return the analysis in this exact order:

1. Existing UOM Architecture Review
2. Existing Purchase Order Architecture Review
3. Existing GRN Architecture Review
4. Existing Inventory Architecture Review
5. Unit Concepts and Terminology
6. Problems Found
7. Recommended Data Model
8. Required Database Changes
9. Purchase Order Business Rules
10. Granite/Marble Purchase Rules
11. Tile Purchase Rules
12. Sanitaryware Purchase Rules
13. PO UI/UX Changes
14. PO → GRN Integration
15. Inventory Integration
16. Pricing Calculation Rules
17. Tax/Discount Rules
18. Over-Receipt Rules
19. API Changes
20. Backend Service Changes
21. React Changes
22. Migration/Refactoring Plan
23. Automated Test Plan
24. Final Architecture

====================================================
IMPORTANT ARCHITECTURAL RULES
====================================================

NEVER assume:

purchase quantity unit = pricing unit

NEVER assume:

pricing unit = inventory unit

NEVER create a fixed:

SLAB → SQ.FT.

conversion for granite or marble.

NEVER calculate granite PO value as:

number_of_slabs × price_per_sqft

unless an explicit expected area has been provided.

NEVER require individual granite slab dimensions during PO creation.

Capture actual slab dimensions and area during GRN.

NEVER lose the original commercial purchasing quantity.

NEVER replace slab quantity with area.

Always preserve:

slab count

- actual area

for granite/marble inventory.

Do not create product-specific hard-coded unit logic when the existing UOM architecture can express the rule generically.

Do not introduce a Workflow Engine for this task.

Use the existing RBAC and domain-service architecture for authorization.

The final architecture must support future configurable workflow without requiring a redesign.

The result must be production-grade and suitable for a multi-tenant ERP handling tiles, sanitaryware, granite, marble, and other building materials.
