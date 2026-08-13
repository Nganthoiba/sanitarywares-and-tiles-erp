You are the Lead UX Architect, Senior React Architect, Senior Laravel Architect, Product Catalog Domain Expert, and ERP Usability Specialist.

You are working on an EXISTING Laravel + React ERP system for:

- Tiles
- Sanitaryware
- Granite
- Marble
- Other building materials

The existing application contains a Product Catalog / Product Specification module with concepts such as:

- Product Families
- Product Variants
- Product Categories
- Brands
- Manufacturers
- Product Attributes
- Product Units
- Unit Conversions
- GTIN
- SKU
- Barcode
- Product Tax Profiles
- Purchase Price
- Sale Price
- Standard Products
- Measured Materials

The existing implementation currently exposes Product Families, Product Variants, Create Family, and Create Variant as prominent tabs/actions.

This has made the interface unnecessarily complicated.

============================================================
PRIMARY OBJECTIVE
============================================================

Redesign the Product Catalog user experience around the user's mental model rather than the database structure.

The user should primarily think:

"I want to manage my products."

The user should NOT have to think:

"Should I create a Product Family or Product Variant?"

"Which tab contains variants?"

"Do I need to create a family before creating a product?"

"Is this product a family or a variant?"

The database may continue to maintain:

Product Families
Product Variants

but these should NOT dominate the primary user interface.

============================================================
CORE UX PRINCIPLE
============================================================

DATABASE STRUCTURE ≠ USER INTERFACE STRUCTURE

The database may contain:

product_families
product_variants
product_attributes
product_units
product_tax_profiles

but the user-facing module should primarily be:

PRODUCTS

The internal data model must not dictate the navigation experience.

============================================================
PART 1 — RENAME THE USER-FACING MODULE
============================================================

Replace user-facing terminology such as:

"Product Catalog & Specification Engine"

with:

"Products"

or:

"Product Catalog"

Prefer:

"Products"

for the main navigation item.

Do not expose the word:

"Specification Engine"

in normal user-facing navigation.

Technical documentation may continue using the architectural name where appropriate.

============================================================
PART 2 — REDESIGN MAIN PRODUCT PAGE
============================================================

The main page should be a product registry/list.

Recommended structure:

Products

                                  [+ Add Product]

[ Search products... ]

[Category ▼] [Brand ▼] [Product Type ▼] [Status ▼]

---

Product
Category
Brand
SKU
Status

---

Example:

600×600 Glossy White Tile
Tiles
Kajaria
KAJ-600-WHT
Active

Wash Basin
Sanitaryware
Hindware
HW-001
Active

Black Granite
Granite
ABC
GR-001
Active

Do not make:

Product Variants
Product Families
Create Variant
Create Family

the primary tabs of this screen.

============================================================
PART 3 — PRIMARY ACTION
============================================================

The primary creation action must be:

- Add Product

NOT:

- Create Variant

NOT:

- Create Family

The user's normal workflow should be:

Products
↓

- Add Product
  ↓
  Create Product
  ↓
  Save
  ↓
  Product Detail

============================================================
PART 4 — PRODUCT FAMILY SHOULD BECOME OPTIONAL
============================================================

Product Family remains an existing domain concept.

DO NOT delete it from the database merely because it is being hidden from the primary UI.

A product may optionally belong to a Product Family.

In the Add Product form:

Product Family
[ Select Family ▼ ] [+ New Family]

The field should be optional unless existing business rules require it.

If the organization does not use Product Families, users should still be able to create products.

The user must NOT be forced to understand Product Family before creating an ordinary product.

============================================================
PART 5 — CREATE FAMILY AS A SECONDARY ACTION
============================================================

Do NOT place:

Create Family

as a primary tab next to:

Products
Variants

Instead, allow Family creation contextually.

Example:

Product Family
[ Eternity ▼ ] [+ New Family]

Clicking:

- New Family

may open a small modal or dedicated dialog:

Create Product Family

Name
Code
Brand/category association if applicable

[Cancel] [Create Family]

After creation, the newly created family should automatically become selected.

This is progressive disclosure.

============================================================
PART 6 — PRODUCT VARIANT TERMINOLOGY
============================================================

The existing database concept of Product Variant may remain.

However, do NOT force the user to think of a newly created item as:

"Create Variant."

The user should think:

"Create Product."

Internally:

Product
→ Product Variant

may continue to be the data model.

For example:

User sees:

600×600 Glossy White Tile

Database may store:

Product Family:
Kajaria Eternity

Product Variant:
600×600 Glossy White Tile

The database architecture remains intact.

============================================================
PART 7 — PRODUCT DETAIL PAGE
============================================================

Clicking a product from the registry should open a Product Detail page.

Recommended structure:

---

600×600 Glossy White Tile

SKU: KAJ-600-WHT
Brand: Kajaria
Status: Active

## [Edit Product]

Tabs or sections:

Overview
Specifications
Units
Pricing
Inventory

Do not create separate top-level navigation for every internal product concept.

============================================================
PART 8 — OVERVIEW
============================================================

Show:

Product Name
Category
Brand
Manufacturer
Product Family (if any)
SKU
GTIN
Barcode
Product Type
Status

Example:

Product:
600×600 Glossy White Tile

Category:
Tiles

Brand:
Kajaria

Manufacturer:
Kajaria Ceramics

Family:
Eternity

SKU:
KAJ-600-WHT

GTIN:
...

Product Type:
Standard

Status:
Active

============================================================
PART 9 — SPECIFICATIONS
============================================================

Show dynamic product attributes.

For a tile:

Size:
600 × 600 mm

Thickness:
8 mm

Finish:
Glossy

Color:
White

For granite:

Thickness
Finish
Color
Grade

For sanitaryware:

Type
Size
Color
Material

Use the existing dynamic attribute architecture.

Do NOT hard-code attribute fields into the React component if the existing system already supports dynamic specifications.

============================================================
PART 10 — UNITS
============================================================

Product Units should be a secondary product-detail section.

Example:

Product:
600×600 Tile

Inventory/Primary Unit:
PCS

Additional Unit:

BOX

Conversion:

1 BOX = 4 PCS

This is where the user can manage unit relationships.

Do NOT put:

Pieces per Box

inside the main Product creation form.

Do NOT create product-specific fields such as:

pieces_per_box
pieces_per_dozen
meters_per_roll

when the existing Unit Conversion system can represent them.

============================================================
PART 11 — PRICING
============================================================

Show default/master product pricing separately.

Example:

Purchase Price:
₹800

Sale Price:
₹1,000

Tax Profile:
GST 18%

Clearly distinguish these from transaction prices.

A Purchase Order may use a different supplier-specific negotiated price.

Do not assume:

Product Purchase Price = Purchase Order Price.

============================================================
PART 12 — INVENTORY
============================================================

Product Detail may contain an Inventory section.

For standard products:

Current Stock
Available Stock
Reserved Stock

For measured materials such as granite:

Current Slabs
Total Area
Available Area
Reserved Area

Do not duplicate the entire Inventory module inside Product Detail.

Provide useful summary information and navigation to inventory where appropriate.

============================================================
PART 13 — STANDARD PRODUCT CREATION
============================================================

The Add Product form should be simple.

Recommended sections:

1. Basic Information
2. Identification
3. Product Type
4. Commercial Information
5. Specifications

Example:

---

## ADD PRODUCT

Basic Information

Product Name
[ 600×600 Glossy White Tile ]

Category
[ Tiles ▼ ]

Brand
[ Kajaria ▼ ]

Manufacturer
[ Kajaria Ceramics ▼ ]

Product Family
[ Eternity ▼ ] [+ New Family]

---

Identification

SKU
[ KAJ-600-WHT ]

GTIN
[ ]

Barcode
[ ]

---

Product Type

[ Standard ▼ ]

---

Commercial Information

Purchase Price
[ ₹800 ]

Sale Price
[ ₹1,000 ]

Tax Profile
[ GST 18% ▼ ]

---

Specifications

Size
[ 600 × 600 mm ]

Thickness
[ 8 mm ]

Finish
[ Glossy ]

Color
[ White ]

---

[Cancel] [Save Product]

============================================================
PART 14 — MEASURED MATERIAL CREATION
============================================================

If:

Product Type = Measured Material

show only the additional information necessary.

Example:

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

Do NOT require:

Slab Length
Slab Width
Slab Area

during product creation.

Actual slab measurements belong to GRN/inventory receiving.

============================================================
PART 15 — GRANITE/MARBLE UX
============================================================

The user should not be required to understand:

- Pricing Unit
- Order Unit
- Rate Basis
- Inventory Behavior Model

during Product creation.

The user only needs to establish:

Product Type:
Measured Material

Physical Object:
SLAB

Measurement:
SQ.FT.

The actual relationship between:

SLAB

and:

SQ.FT.

is determined at GRN because each slab has a variable physical area.

Do NOT create:

1 SLAB = X SQ.FT.

as a fixed conversion.

============================================================
PART 16 — PRODUCT FAMILY MANAGEMENT
============================================================

Provide a secondary Family management screen only if the existing system requires it.

Navigation could be:

Products
Categories
Brands
Families

Families should NOT be the default landing screen.

Family management may provide:

Family Name
Code
Category
Brand
Description
Number of Products

Example:

Kajaria Eternity
Tiles
Kajaria
24 Products

Clicking the family may show its associated products.

============================================================
PART 17 — PRODUCT FAMILY → PRODUCTS
============================================================

If a user opens a Family:

Kajaria Eternity

show:

Products in this Family

---

Product
SKU
Size
Color
Finish
Status

---

600×600 White
KAJ001
600×600
White
Glossy
Active

600×600 Grey
KAJ002
600×600
Grey
Matt
Active

Do NOT call these rows:

"Variants"

in the primary UI.

The technical database relationship can remain Product Family → Product Variant.

============================================================
PART 18 — SEARCH AND FILTERING
============================================================

The main Products page should provide useful search/filtering.

Search by:

- Product Name
- SKU
- GTIN
- Barcode

Filter by:

- Category
- Brand
- Manufacturer
- Product Type
- Status
- Product Family

Optional:

- Active/Inactive
- Stock availability

Do not overload the initial page with every possible filter.

Use a collapsible Advanced Filters section if necessary.

============================================================
PART 19 — PRODUCT ACTIONS
============================================================

Product list actions should include:

View
Edit
Deactivate/Activate

Potential future actions:

Duplicate
Archive

Do not expose technical actions such as:

Create Variant
Create Family

as normal row actions.

============================================================
PART 20 — PRODUCT CREATION VS PRODUCT DUPLICATION
============================================================

If the existing system supports product variants through duplication:

allow a future:

Duplicate Product

operation.

For example:

600×600 White Tile

Duplicate

→

600×600 Grey Tile

The duplicated product can inherit:

- Category
- Brand
- Manufacturer
- Attribute structure
- Tax profile
- UOM configuration

but must receive new:

- SKU
- GTIN
- Barcode

according to business rules.

Do NOT implement this unless the existing architecture already supports safe duplication.

If not, document it as a future enhancement.

============================================================
PART 21 — NAVIGATION
============================================================

Replace the existing confusing top-level structure:

Product Variants
Product Families
Create Variant
Create Family

with:

Products

and optionally:

Categories
Brands
Families

The primary user journey is:

Products
↓
View Product
↓
Edit Product

or:

Products
↓

- Add Product
  ↓
  Create Product

============================================================
PART 22 — ROUTING
============================================================

Review the existing React routing/tab architecture.

Do not create unnecessary routes.

Recommended conceptual routes:

/products
/products/create
/products/{id}
/products/{id}/edit

Optional:

/products/families
/products/categories
/products/brands

Reuse the project's existing routing conventions.

Do not break existing routes without providing migration/redirect handling where necessary.

============================================================
PART 23 — COMPONENT STRUCTURE
============================================================

Review the existing React components before creating new ones.

A possible structure:

resources/js/components/product/

ProductList.jsx
ProductForm.jsx
ProductDetail.jsx
ProductOverview.jsx
ProductSpecifications.jsx
ProductUnits.jsx
ProductPricing.jsx
ProductFamilySelector.jsx
ProductFamilyModal.jsx

DO NOT create duplicate components if equivalent components already exist.

ProductEntry.jsx may be renamed/refactored to ProductForm.jsx if that matches the existing architecture.

Do not perform a large rename solely for naming preference if it creates unnecessary risk.

============================================================
PART 24 — BOOTSTRAP UX
============================================================

Use the project's existing Bootstrap 5 conventions.

Do NOT introduce Tailwind.

Prefer:

- clean tables
- compact forms
- Bootstrap cards where appropriate
- modals for small secondary operations
- offcanvas/accordion for advanced filters if appropriate
- clear empty states
- responsive layout

Avoid:

- excessive nested cards
- excessive tabs
- technical terminology
- unnecessary configuration panels
- long single-page forms

============================================================
PART 25 — ACCESSIBILITY
============================================================

Ensure:

- labels are associated with fields
- keyboard navigation works
- buttons have meaningful labels
- validation errors are clear
- modal focus is handled correctly
- color is not the only indicator of status
- tables remain usable on smaller screens

============================================================
PART 26 — BACKEND COMPATIBILITY
============================================================

DO NOT redesign the Product database merely to simplify the UI.

The existing database may continue to contain:

product_families
product_variants
product_attributes
product_units
unit_conversions
product_tax_profiles

The UI should simply provide a better abstraction over them.

Review the existing:

- Controllers
- Form Requests
- Services
- API Resources
- Models
- Policies

and modify only what is required.

organization_id must always be derived from authenticated organization context.

Never trust organization_id from the React client.

============================================================
PART 27 — PRODUCT FAMILY DATABASE RELATIONSHIP
============================================================

Preserve:

Product Family
↓
Product Variant/Product

if that is the current domain model.

But present it to users as:

Product Family
↓
Products

where possible.

Do not rename database tables or models simply to make the UI terminology different.

The UI terminology and internal domain terminology may differ.

============================================================
PART 28 — DO NOT REMOVE FAMILY/VALUE CAPABILITY
============================================================

This task is a UX simplification.

It is NOT permission to remove Product Family functionality.

Users who need Product Families must still be able to:

- create a family
- edit a family
- assign products to a family
- view products belonging to a family
- filter products by family

But these functions should be secondary to normal Product Management.

============================================================
PART 29 — PRODUCT CREATION WORKFLOW
============================================================

The final primary workflow should be:

USER OPENS:

Products

        ↓

Clicks:

- Add Product

          ↓

Enters:

Basic Information
Identification
Product Type
Commercial Information
Specifications

        ↓

Optional:

Select Product Family

        ↓

Save Product

        ↓

Product Detail

        ↓

Optional secondary configuration:

Units
Specifications
Pricing
Family

This should be the default workflow.

============================================================
PART 30 — PRODUCT FAMILY CREATION WORKFLOW
============================================================

Family creation should be possible without making it mandatory.

Recommended workflow:

Add Product

Product Family
[ Select Family ▼ ] [+ New Family]

User clicks:

- New Family

Modal:

Create Product Family

Name:
[________________]

Code:
[________________]

Description:
[________________]

[Cancel] [Create]

After successful creation:

Product Family automatically becomes selected.

============================================================
PART 31 — TESTING
============================================================

Create/update tests for:

Frontend:

1. Products page loads.
2. Product list displays correctly.
3. Search works.
4. Filters work.
5. Add Product is the primary action.
6. Product Family is optional.
7. New Family modal works.
8. Product creation works.
9. Product editing works.
10. Product detail works.
11. Specifications display correctly.
12. Units display correctly.
13. Pricing displays correctly.
14. Measured Material fields appear conditionally.
15. Granite does not request slab dimensions during product creation.
16. Product Family is not required for standard product creation.
17. Product Family products can be viewed.
18. Existing products remain accessible.

Backend:

19. Product creation remains organization-scoped.
20. Product family relationships remain valid.
21. Product variant relationships remain valid.
22. Existing API consumers do not break.
23. Existing UOM relationships remain valid.
24. Existing tax profile relationships remain valid.

============================================================
PART 32 — MIGRATION POLICY
============================================================

Do NOT create destructive database migrations merely to simplify the UI.

Before changing any database field:

1. Search the entire codebase for its usage.
2. Determine whether backend logic depends on it.
3. Determine whether other modules depend on it.
4. Determine whether it can be deprecated safely.
5. Only then propose a migration.

The following fields/concepts should NOT automatically be deleted:

- purchase_unit_id
- sales_unit_id
- base_unit_id
- inventory_behavior
- pieces_per_box

The UI may stop exposing them while the backend continues using them until the architecture is safely refactored.

============================================================
PART 33 — IMPORTANT UX RULES
============================================================

DO NOT:

- Make Product Family and Product Variant separate primary tabs.
- Make Create Family a primary action.
- Make Create Variant a primary action.
- Force users to create a family before creating a product.
- Expose technical database terminology.
- Expose "Inventory Behavior Model" in the main product workflow.
- Expose "Base Accounting Unit" in the main product workflow.
- Expose "Pieces per Box" as a special product field.
- Make Product Catalog feel like an administration/configuration console.

DO:

- Make Products the primary concept.
- Make Add Product the primary action.
- Make Product Family optional.
- Provide Family creation contextually.
- Present technical relationships behind simple user-facing terminology.
- Keep advanced configuration secondary.
- Keep the interface compact.
- Preserve the existing backend/domain model.

============================================================
PART 34 — FINAL INFORMATION ARCHITECTURE
============================================================

The recommended user-facing navigation is:

Products
│
├── All Products
├── Categories
├── Brands
└── Families

The primary screen is:

Products

The primary action is:

- Add Product

The primary entity the user manages is:

Product

The technical model may remain:

Product Family
↓
Product Variant

but the user should normally experience:

Product Family
↓
Products

============================================================
PART 35 — FINAL OUTPUT
============================================================

Before modifying code, provide:

1. Current Product Catalog UI analysis.
2. Current navigation analysis.
3. Current Product Family / Variant UX analysis.
4. Problems with the existing tab structure.
5. Recommended information architecture.
6. Recommended Products page.
7. Recommended Product Detail page.
8. Recommended Add Product workflow.
9. Product Family UX.
10. Product Variant UX mapping.
11. UOM/Units UX.
12. Granite/Marble UX.
13. React component changes.
14. Routing changes.
15. Backend/API impact.
16. Database impact.
17. Migration requirements, if any.
18. Test plan.
19. Final implementation checklist.

IMPORTANT:

Do not blindly implement the redesign before analyzing the existing code.

Do not duplicate existing components.

Do not break existing Product Family/Product Variant relationships.

Do not redesign the database simply because the UI is being simplified.

The final result must make the Product Catalog feel like a normal ERP "Products" module rather than a technical "Product Specification Engine."

The user should be able to perform the common task:

"Add a product"

without needing to understand:

Product Family
Product Variant
Inventory Behavior
UOM architecture
Accounting units
Conversion architecture

unless those concepts become relevant to the specific product.
