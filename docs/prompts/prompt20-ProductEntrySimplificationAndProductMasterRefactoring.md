You are working on an EXISTING Laravel + React ERP system for Tiles, Sanitaryware, Granite, Marble and other building materials.

The project already has:

- Product Family
- Product Variants
- Categories
- Brands
- Manufacturers
- SKU
- GTIN
- Barcode
- Product Attributes
- Product Tax Profiles
- Units of Measure
- Unit Conversions
- Purchase Price
- Sale Price
- Inventory Objects
- Granite/Marble slab tracking
- Purchase domain
- GRN domain
- Inventory domain

The existing React ProductEntry.jsx form has become too complex because it currently exposes too many internal ERP concepts to the user.

The objective of this task is to SIMPLIFY Product Entry without breaking the existing database architecture or domain boundaries.

============================================================
PRIMARY ARCHITECTURAL PRINCIPLE
============================================================

Product Entry should answer:

"What is this product?"

It should NOT attempt to configure every aspect of:

- purchasing
- sales
- inventory
- accounting
- GRN
- stock movement
- valuation

Those concerns belong to their respective domains.

The Product Entry screen should therefore be a simple Product Master interface.

============================================================
PART 1 — STUDY THE EXISTING CODE FIRST
============================================================

Before making any changes, inspect the existing implementation.

At minimum inspect:

1. resources/js/components/.../ProductEntry.jsx
2. Product Family components
3. Product Variant components
4. Product models
5. Product Variant models
6. Product migrations
7. Product attribute migrations/models
8. Product tax profile migrations/models
9. Units of Measure migrations/models
10. Unit conversion migrations/models
11. Brand models
12. Manufacturer models
13. Product APIs
14. Product Form Requests
15. Product Services
16. Existing inventory-related product configuration
17. Existing granite/slab-related configuration

DO NOT redesign the database blindly.

Reuse the existing architecture wherever possible.

============================================================
PART 2 — REMOVE UNNECESSARY COMPLEXITY FROM PRODUCT ENTRY
============================================================

The current ProductEntry form exposes concepts such as:

- Purchase Unit
- Sales Unit
- Base Accounting Unit
- Inventory Behavior Model
- Pieces per Box
- Brand Override
- Manufacturer
- Tax Profile
- Purchase Price
- Sales Price

Review each one.

The following concepts MUST NOT be presented as advanced ERP configuration fields in the primary Product Entry form:

1. Base Accounting Unit
2. Inventory Behavior Model
3. Pieces per Box

Purchase Unit and Sales Unit should also be removed from the main Product Entry form if they are already represented by the existing UOM/conversion architecture.

Do NOT create replacement fields merely to preserve the old UI.

============================================================
PART 3 — PRODUCT ENTRY SHOULD FOCUS ON PRODUCT MASTER DATA
============================================================

The primary Product Entry form should contain approximately these sections:

---

## A. BASIC INFORMATION

Product Family
Product Name / Variant Name
Category
Brand
Manufacturer

---

## B. IDENTIFICATION

SKU
GTIN
Barcode

---

## C. PRODUCT TYPE

Provide a simple product classification.

At minimum support:

STANDARD

and

MEASURED MATERIAL

Do not expose the term "Inventory Behavior Model" to ordinary users.

Use a business-friendly label such as:

"Product Type"

or another clear equivalent.

---

## D. COMMERCIAL INFORMATION

Purchase Price
Sale Price
Tax Profile

---

## E. SPECIFICATIONS

Dynamic product attributes already supported by the existing product architecture.

Examples:

Tile:

- Length
- Width
- Thickness
- Finish
- Color

Granite:

- Thickness
- Finish
- Color
- Grade

Sanitaryware:

- Type
- Color
- Size
- Material

Do NOT hard-code these attributes into ProductEntry.jsx if the existing dynamic attribute architecture already supports them.

============================================================
PART 4 — PRODUCT FAMILY AND PRODUCT VARIANT
============================================================

Respect the existing distinction between Product Family and Product Variant.

Example:

Product Family:

Kajaria Tiles

Product Variant:

Kajaria 600 × 600 Glossy White

The UI should not unnecessarily force users to enter family-level and variant-level information repeatedly.

If the existing architecture requires both, make the workflow clear.

Prefer:

Product Family
↓
Product Variants

rather than one giant form containing unrelated family and variant configuration.

If the current implementation combines these workflows, refactor carefully without breaking existing APIs.

============================================================
PART 5 — UOM ARCHITECTURE
============================================================

DO NOT create a new UOM system.

The existing UOM and Unit Conversion architecture must remain the authoritative mechanism.

Remove special-purpose fields such as:

pieces_per_box

if the same business rule can be represented by:

unit_conversions

For example:

1 BOX = 4 PCS

should be represented as a UOM conversion.

Do NOT create:

pieces_per_box
pieces_per_dozen
meters_per_roll
etc.

as separate product columns.

The conversion system should remain generic.

============================================================
PART 6 — PRODUCT ENTRY MUST NOT BECOME A UOM CONFIGURATION SCREEN
============================================================

The primary Product Entry form should not expose all UOM concepts.

Do not require users to understand:

- Base UOM
- Accounting UOM
- Purchase UOM
- Sales UOM
- Pricing UOM
- Conversion UOM

unless the existing business workflow genuinely requires user input.

If UOM configuration needs to be performed, design it as a separate Product Units / Unit Conversion configuration interface.

For example:

PRODUCT UNITS

Unit:
PCS

Additional Unit:
BOX

Conversion:

1 BOX = 4 PCS

This should be a separate concern from basic Product Entry.

============================================================
PART 7 — STANDARD PRODUCTS
============================================================

For standard products such as:

- Tiles
- Sanitaryware
- Faucets
- Accessories

the user should experience a simple product-entry workflow.

Example:

Product:
600 × 600 Tile

Category:
Tiles

Brand:
Kajaria

Product Type:
Standard

SKU:
KAJ-600-WHT

GTIN:
...

Purchase Price:
₹800

Sale Price:
₹1,000

Tax Profile:
GST ...

Specifications:
600 × 600
Glossy
White

The user should NOT need to configure:

Inventory Behavior Model
Base Accounting Unit
Pieces per Box

during this process.

============================================================
PART 8 — MEASURED MATERIALS
============================================================

Granite and marble require special physical measurement behavior.

However, this complexity must be introduced only when necessary.

When Product Type is:

MEASURED MATERIAL

show only the additional configuration required for measured materials.

For example:

Physical Object:
SLAB

Measurement:
SQ.FT.

Do not expose:

Order Unit
Pricing Unit
Rate Basis
Inventory Behavior Model
Base Accounting Unit

as separate technical fields.

The UI should remain understandable.

============================================================
PART 9 — GRANITE/MARBLE RULE
============================================================

Do NOT create a fixed conversion:

1 SLAB = X SQ.FT.

for granite or marble.

The actual area of each slab is determined when the slab is physically received.

Product Entry should only establish that the product is a measured material and that the relevant physical measurement is area.

Example:

Product:
Black Granite

Product Type:
Measured Material

Physical Object:
SLAB

Measurement:
SQ.FT.

Actual dimensions:

DO NOT enter at Product Creation.

They belong to GRN/inventory receiving.

============================================================
PART 10 — PURCHASE PRICE AND SALE PRICE
============================================================

Keep Purchase Price and Sale Price only if the existing Product architecture treats them as master/default prices.

Clearly distinguish:

DEFAULT/MASTER PRICE

from:

TRANSACTION PRICE

The Purchase Order must remain capable of using the actual supplier-specific transaction price.

Do not assume:

Product Purchase Price = PO Purchase Price

The product-level price should be treated as a default/reference value where appropriate.

============================================================
PART 11 — TAX PROFILE
============================================================

Keep Tax Profile in Product Master if this is already part of the existing architecture.

Do not duplicate:

CGST
SGST
IGST

inside ProductEntry if they are already represented by:

product_tax_profiles

The product should reference the tax profile.

============================================================
PART 12 — GTIN / BARCODE
============================================================

Keep:

SKU
GTIN
Barcode

as identification fields.

Do not confuse:

SKU
GTIN
Barcode

with inventory objects.

GTIN identifies the trade item/product variant.

Inventory objects represent physical stock where applicable, particularly for individually tracked materials such as slabs.

============================================================
PART 13 — INVENTORY BEHAVIOR SHOULD NOT BE EXPOSED DIRECTLY
============================================================

Do NOT display:

Inventory Behavior Model

as a primary form field.

The system may internally determine inventory behavior from:

- Product Type
- Product configuration
- UOM configuration
- Existing inventory architecture

For example:

STANDARD

can support ordinary countable/packaged products.

MEASURED MATERIAL

can support individually measured physical materials such as granite and marble.

Do not over-engineer this into a large behavior configuration UI at this stage.

============================================================
PART 14 — REMOVE "PIECES PER BOX"
============================================================

Remove:

Pieces per Box

from ProductEntry.jsx.

Do not replace it with another product-specific field.

Use the generic unit conversion architecture.

Example:

Product:
600 × 600 Tile

UOM:

PCS
BOX

Conversion:

1 BOX = 4 PCS

This can be configured separately.

============================================================
PART 15 — PRODUCT ENTRY UX
============================================================

Redesign ProductEntry.jsx using a clean Bootstrap-based layout consistent with the existing application.

Preferred sections:

1. Basic Information
2. Identification
3. Product Type
4. Commercial Information
5. Specifications

Avoid excessive cards, nested panels, and technical configuration sections.

The user should be able to understand the form without ERP/domain knowledge.

Use:

- Bootstrap 5
- Existing project UI conventions
- Existing form components where appropriate
- Clear labels
- Inline validation
- Helpful placeholders
- Minimal explanatory text

Do not introduce Tailwind.

============================================================
PART 16 — CONDITIONAL UI
============================================================

The form should remain compact by showing additional fields only when necessary.

For example:

Product Type:

[ Standard ▼ ]

shows normal fields.

If:

Product Type:

[ Measured Material ]

then show:

Physical Object:
[ Slab ]

Measurement:
[ SQ.FT. ]

Do not show granite-specific fields for standard products.

============================================================
PART 17 — API COMPATIBILITY
============================================================

Review the existing Product API.

Do not create unnecessary new endpoints.

If the existing API already supports the required product fields, reuse it.

If changes are necessary:

- update Request validation
- update Controller
- update Service
- update Resource
- update React API client

Ensure the API remains organization-aware.

organization_id MUST NOT be supplied by the React client.

The backend must derive organization_id from the authenticated organization context.

============================================================
PART 18 — BACKEND VALIDATION
============================================================

Validate:

Product Family
Product Name
Category
SKU
GTIN
Barcode
Product Type
Brand
Manufacturer
Tax Profile
Purchase Price
Sale Price
Dynamic attributes

Validation rules must remain consistent with the existing database constraints.

For measured materials:

If Product Type = MEASURED MATERIAL:

- physical object configuration must be valid
- measurement unit must be valid

Do NOT require actual slab dimensions at product creation.

============================================================
PART 19 — DATABASE REVIEW
============================================================

Before modifying migrations:

determine whether the current database already contains fields for:

- product type
- inventory behavior
- purchase unit
- sales unit
- base unit
- pieces per box
- measurement unit

Do not immediately delete columns from the database.

If existing data uses these fields:

1. identify usage
2. identify dependencies
3. identify whether they are redundant
4. determine migration strategy
5. preserve existing data
6. remove/deprecate only when safe

A UI simplification does NOT automatically require a destructive database migration.

============================================================
PART 20 — EXISTING PRODUCT DATA
============================================================

Existing products must continue to work.

Do not break:

- existing tile variants
- sanitaryware variants
- granite products
- marble products
- existing UOM relationships
- existing inventory records
- existing Purchase Orders
- existing GRNs

If the current database contains:

inventory_behavior
purchase_unit_id
sales_unit_id
base_unit_id
pieces_per_box

determine whether each is still required by backend logic.

Do not remove a field merely because it has been removed from the UI.

============================================================
PART 21 — PRODUCT UNITS SCREEN
============================================================

If the existing project does not already have an appropriate UOM configuration screen, design a separate interface:

PRODUCT UNITS

Example:

Product:
600 × 600 Tile

Base/Inventory Unit:
PCS

Additional Units:

BOX

Conversion:

1 BOX = 4 PCS

This interface should be independent from the basic Product Entry form.

Do not implement this as part of the current task unless the existing architecture makes it necessary.

If it is not implemented now, document it as the next logical module.

============================================================
PART 22 — PRODUCT ENTRY EXAMPLE
============================================================

The final UI should allow a user to create:

---

## Example 1 — Tile

Product Family:
Kajaria Tiles

Product:
600 × 600 Glossy White

Category:
Tiles

Brand:
Kajaria

Product Type:
Standard

SKU:
KAJ-600-WHT

GTIN:
...

Purchase Price:
₹800

Sale Price:
₹1,000

Tax Profile:
GST 18%

Specifications:
600 × 600
Glossy
White

---

## Example 2 — Sanitaryware

Product Family:
Hindware

Product:
Wall Hung WC

Category:
Sanitaryware

Product Type:
Standard

SKU:
...

Purchase Price:
₹8,000

Sale Price:
₹10,000

Tax Profile:
GST 18%

Specifications:
...

---

## Example 3 — Granite

Product Family:
Indian Granite

Product:
Black Granite

Category:
Granite

Product Type:
Measured Material

Physical Object:
SLAB

Measurement:
SQ.FT.

SKU:
...

Purchase Price:
Reference/default price if applicable

Sale Price:
Reference/default price if applicable

Tax Profile:
GST ...

Specifications:
Thickness
Finish
Color
Grade

Do NOT ask for:

Slab length
Slab width
Slab area

at Product Creation.

Those belong to GRN/inventory.

============================================================
PART 23 — TESTING
============================================================

Update/add tests for:

1. Standard product creation.
2. Measured material creation.
3. Tile creation.
4. Sanitaryware creation.
5. Granite creation.
6. Marble creation.
7. SKU uniqueness rules.
8. GTIN validation.
9. Tax profile validation.
10. Dynamic attribute validation.
11. Measured-material configuration validation.
12. Organization isolation.
13. Existing product compatibility.
14. Existing UOM compatibility.
15. Existing unit conversion compatibility.

React tests should verify:

1. Standard product form is compact.
2. Measured-material fields appear only when selected.
3. Pieces per Box is no longer shown.
4. Base Accounting Unit is no longer shown.
5. Inventory Behavior Model is no longer shown.
6. UOM configuration is not unnecessarily exposed.
7. Validation messages are clear.
8. Existing product editing continues to work.

============================================================
PART 24 — DO NOT OVER-ENGINEER
============================================================

This is a simplification task.

Do NOT introduce:

- new Workflow Engine functionality
- new Inventory Behavior Engine
- new UOM engine
- new accounting engine
- new pricing engine
- new product attribute engine

Reuse existing domain services and models.

The objective is to simplify the user experience while preserving the existing domain architecture.

============================================================
PART 25 — FINAL ARCHITECTURAL PRINCIPLE
============================================================

The final separation should be:

PRODUCT MASTER

"What is this?"

        ↓

PRODUCT UNITS

"How can its quantity be expressed?"

        ↓

PURCHASE

"How are we buying it?"

        ↓

GRN

"What did we actually receive?"

        ↓

INVENTORY

"How is the physical stock managed?"

        ↓

SALES

"How are we selling it?"

Do NOT make Product Entry responsible for all of these questions.

============================================================
DELIVERABLES
============================================================

Provide:

1. Existing ProductEntry.jsx analysis.
2. Current fields classification.
3. Fields to keep.
4. Fields to remove from UI.
5. Fields to move to another module.
6. Recommended Product Entry UX.
7. Recommended Product Type architecture.
8. Recommended UOM architecture integration.
9. Granite/Marble handling.
10. Backend impact analysis.
11. Database impact analysis.
12. API impact analysis.
13. React component refactoring plan.
14. Migration plan if required.
15. Automated test plan.
16. Final recommended Product Entry architecture.

IMPORTANT:

Do not start by rewriting the entire application.

First analyze the existing ProductEntry.jsx and related backend code.

Then identify the minimum required changes.

Then implement the refactoring.

Preserve existing functionality wherever it remains valid.

The final ProductEntry.jsx should be significantly simpler than the current implementation while remaining compatible with the existing Laravel backend and database architecture.
