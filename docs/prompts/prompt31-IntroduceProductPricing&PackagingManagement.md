You are working on an existing Laravel + React ERP application for
Tiles, Sanitaryware, Granite, Marble, CP Fittings, Adhesives,
Accessories and other building materials.

This is an EXISTING application.

Before making any changes, thoroughly inspect the current implementation
and database structure related to:

- Products
- Product Variants
- Product Categories
- Brands
- Manufacturers
- Product Attributes / Specifications
- UOM / Units
- Product Type
- Inventory Behavior
- Purchase Orders
- GRN
- Batches / Lots
- Inventory / Stock
- Sales
- Pricing
- Organization / Tenant isolation
- Roles and permissions
- Menus

Do not create a parallel architecture if equivalent functionality
already exists.

============================================================

1. # OBJECTIVE

Separate PRODUCT DEFINITION from PRODUCT COMMERCIAL SETTINGS.

The current Product / Product Variant design is becoming unnecessarily
complex because it is attempting to manage:

- Product identity
- Product details
- Product Type
- Inventory Behavior
- Cost Price
- Selling Price
- Packaging
- UOM conversions
- Batch-specific packaging

in the same workflow.

Redesign this so that the normal "Add New Product Variant" form remains
simple.

The Product Entry form should primarily answer:

    "What product is this?"

A separate organization-level page should answer:

    "How do we currently buy/sell this product?"

============================================================ 2. PRODUCT ENTRY MUST REMAIN SIMPLE
============================================================

Do NOT add Cost Price, Selling Price, or Pieces per Box back into the
main "Add New Product Variant" form unless an existing business
requirement absolutely requires it.

The Product Entry form should contain primarily:

    Product Name
    Brand
    Manufacturer
    Category
    Category-driven Product Details

For example:

    Tiles
        → Tile Size

    Granite Slab
        → Length
        → Width
        → Calculated Area

    Adhesive
        → Weight

    Sanitaryware
        → Category-specific details

Do NOT expose:

    Product Type
    Inventory Behavior
    Attribute Definition
    UOM configuration
    Pricing Unit configuration

to ordinary users during Product creation.

============================================================ 3. NEW MODULE: PRODUCT PRICING & PACKAGING
============================================================

Create a separate organization-specific module/page:

    Product Pricing & Packaging

This page is intended for:

    Organization Admin

and other users who have the appropriate permission.

The page should allow authorized users to maintain the commercial
settings of a Product Variant.

At minimum, it should manage:

    Cost Price (CP)
    Selling Price (SP)
    Current Packaging information

The UI should be simple and business-oriented.

Do not expose unnecessary technical UOM terminology.

============================================================ 4. WHY THIS MUST BE ORGANIZATION-SPECIFIC
============================================================

Products and manufacturers may be global/shared entities.

However:

    Cost Price
    Selling Price
    Commercial packaging
    Commercial terms

belong to the organization.

For example:

    Organization A

    Kajaria Royal Gold 600 × 600 mm
        CP = ₹180 / PCS
        SP = ₹250 / PCS


    Organization B

    Kajaria Royal Gold 600 × 600 mm
        CP = ₹190 / PCS
        SP = ₹275 / PCS

Therefore:

    Product Pricing & Packaging

must NOT be stored as global manufacturer/product master data.

It must be scoped to the Organization.

============================================================ 5. PRICING SHOULD USE A BUSINESS-FRIENDLY BASIS
============================================================

The user should be able to specify the price according to the natural
selling basis of the product.

For example:

Tiles:

    Cost Price
    ₹180 / Piece

    Selling Price
    ₹250 / Piece

Granite:

    Cost Price
    ₹300 / sq.ft.

    Selling Price
    ₹450 / sq.ft.

Adhesive:

    Cost Price
    ₹500 / Bag

    Selling Price
    ₹650 / Bag

Do not force the user to understand abstract terms such as:

    pricing_uom
    base_uom
    conversion_factor

unless these are necessary internally.

The UI should use human-readable labels such as:

    Per Piece
    Per Box
    Per Sq.Ft.
    Per Bag
    Per Kg
    etc.

The actual implementation must use the existing UOM architecture where
appropriate.

============================================================ 6. TILE EXAMPLE
============================================================

Product:

    Kajaria Royal Gold 600 × 600 mm

Organization's current commercial settings:

    Cost Price
    ₹180 / Piece

    Selling Price
    ₹250 / Piece

    Packaging
    1 Box contains 4 Pieces

The UI should display this naturally:

    Kajaria Royal Gold 600 × 600 mm

    Pricing
    ----------------------------

    Cost Price
    ₹180 / Piece

    Selling Price
    ₹250 / Piece


    Packaging
    ----------------------------

    1 Box contains
    [ 4 ] Pieces

Do not require the user to define:

    PCS → BOX conversion

using a technical UOM editor.

============================================================ 7. PACKAGING IS NOT A PERMANENT PRODUCT PROPERTY
============================================================

IMPORTANT:

Do NOT assume:

    pieces_per_box

is a permanent property of the Product Variant.

A manufacturer may change packaging over time.

Example:

    2026:
        1 Box = 4 Pieces

    2028:
        1 Box = 2 Pieces

    2030:
        1 Box = 6 Pieces

The Product Variant remains:

    Kajaria Royal Gold 600 × 600 mm

Do NOT create separate Product Variants merely because the number of
pieces per box changes.

Instead, packaging must be treated as a commercial/inventory packaging
configuration that can change over time.

============================================================ 8. BATCH-SPECIFIC PACKAGING
============================================================

The actual packaging received from a supplier may be different from
the organization's current/default packaging.

Therefore, GRN/Batch must be capable of recording the actual packaging
information for that received batch.

Example:

    Product:
    Kajaria Royal Gold 600 × 600 mm

    Batch:
    KG-2026-001

    Received:
    100 Boxes

    Actual packaging:
    1 Box = 4 Pieces

    Actual quantity:
    400 Pieces

Another batch:

    Batch:
    KG-2028-001

    Received:
    100 Boxes

    Actual packaging:
    1 Box = 2 Pieces

    Actual quantity:
    200 Pieces

Do not overwrite historical batch information when the current
packaging configuration changes.

============================================================ 9. CURRENT PACKAGING VS ACTUAL BATCH PACKAGING
============================================================

Keep these concepts separate.

A. Current Organization Packaging Setting

Managed from:

    Product Pricing & Packaging

Example:

    Current packaging:
    1 BOX = 4 PCS

This represents the organization's current commercial expectation.

B. Actual Batch Packaging

Captured during:

    GRN / Batch

Example:

    Batch KG-2028-001
    1 BOX = 2 PCS

This represents what was actually received.

Historical batch information must remain unchanged.

============================================================ 10. DO NOT CREATE MULTIPLE PRODUCTS FOR PACKAGING CHANGES
============================================================

Do NOT create:

    Kajaria Royal Gold 600 × 600 - 4 PCS/BOX

and:

    Kajaria Royal Gold 600 × 600 - 2 PCS/BOX

as separate Product Variants.

These are the same product.

The correct model is:

    Product Variant
        Kajaria Royal Gold 600 × 600 mm

        ├── Batch A
        │     4 PCS / BOX
        │
        └── Batch B
              2 PCS / BOX

============================================================ 11. PRICING HISTORY
============================================================

Cost Price and Selling Price can change over time.

Do not blindly overwrite historical prices if the existing Sales,
Purchase, or accounting records require historical accuracy.

For example:

    Effective From       CP / PCS      SP / PCS

    01-04-2026           ₹180          ₹250
    01-08-2026           ₹190          ₹265
    01-01-2027           ₹200          ₹280

The current price should be clearly identifiable.

Historical sales must continue to show the price that was actually
used at the time of the transaction.

Inspect the existing Sales/Pricing architecture before implementing
price history.

If the existing application already has an effective-dating mechanism,
reuse it.

============================================================ 12. PRICING MUST NOT ALTER HISTORICAL TRANSACTIONS
============================================================

Changing the current Selling Price must NOT change:

    Existing Sales Invoices
    Existing Sales Invoice Items
    Existing Purchase Orders
    Existing GRNs
    Existing stock valuation records

Transaction records must retain the actual price used at the time of
the transaction.

Current Product Pricing is a future/default commercial setting.

============================================================ 13. TILE PRICE EXAMPLE
============================================================

If:

    Cost Price = ₹180 / Piece
    Selling Price = ₹250 / Piece
    1 Box = 4 Pieces

the system may calculate when required:

    Cost value per Box = ₹720
    Selling value per Box = ₹1,000

These calculated values should not necessarily be stored as separate
prices unless required.

The authoritative pricing remains:

    ₹180 / Piece
    ₹250 / Piece

and the packaging conversion remains:

    1 Box = 4 Pieces

============================================================ 14. GRANITE PRICE EXAMPLE
============================================================

Product:

    Black Galaxy Granite

Current pricing:

    CP = ₹300 / Sq.Ft.
    SP = ₹450 / Sq.Ft.

A batch/slab:

    Length = 8 ft
    Width = 4 ft

Calculated area:

    32 sq.ft.

The system can calculate the commercial value of that slab when
required.

Example:

    32 × ₹450
    = ₹14,400

Do not require the user to manually enter the total slab value.

============================================================ 15. PRODUCT PRICING & PACKAGING UI
============================================================

Create a clean searchable registry.

Example:

    Product Pricing & Packaging

    Search:
    [ Kajaria Royal Gold................ ]

    ------------------------------------------------------------

    Product                         CP          SP       Packaging

    Kajaria Royal Gold 600×600      ₹180        ₹250     4 PCS/BOX
    Kajaria Oasis 600×600           ₹165        ₹230     4 PCS/BOX
    Black Galaxy Granite            ₹300        ₹450     Batch-based

The user should be able to select a product and edit its settings.

============================================================ 16. PRODUCT PRICING & PACKAGING DETAIL PAGE
============================================================

When a product is selected:

    Kajaria Royal Gold 600 × 600 mm

display:

    Pricing
    ----------------------------

    Cost Price
    [ ₹180.00 ]

    Price Basis
    [ Per Piece ]

    Selling Price
    [ ₹250.00 ]

    Price Basis
    [ Per Piece ]


    Packaging
    ----------------------------

    1 Box contains
    [ 4 ] Pieces


    [ Save Changes ]

Use business-friendly labels.

Avoid technical database terminology.

============================================================ 17. GRANITE/MARBLE UI
============================================================

For measured products such as Granite or Marble, pricing may naturally
be based on square feet.

Example:

    Black Galaxy Granite

    Cost Price
    [ ₹300.00 ] / Sq.Ft.

    Selling Price
    [ ₹450.00 ] / Sq.Ft.

Do not force:

    Piece
    Box

onto products where those concepts do not apply.

============================================================ 18. PACKAGING SHOULD BE CONDITIONAL
============================================================

Not every product is packaged in boxes.

Examples:

    Tiles
        → Box / Piece

    Adhesive
        → Bag / Piece / Kg depending on product

    Granite Slab
        → Slab

    Sanitaryware
        → Piece / Box depending on actual business practice

Therefore, the Product Pricing & Packaging page should show
appropriate packaging controls based on the product/category
configuration.

Do not display:

    Pieces per Box

for Granite Slab unless the category actually uses that packaging.

============================================================ 19. DO NOT REINTRODUCE COMPLEX UOM UI
============================================================

The previous design became complicated because the user had to think
about:

    Order Unit
    Pricing Unit
    Inventory Unit
    Conversion Unit

Do NOT reproduce that complexity in this page.

The user should see natural business expressions such as:

    ₹250 / Piece

    ₹450 / Sq.Ft.

    1 Box = 4 Pieces

The application may internally maintain normalized UOM relationships.

============================================================ 20. PACKAGING CONVERSION
============================================================

Internally, the system should be capable of representing:

    1 BOX = 4 PCS

or:

    1 BOX = 2 PCS

or:

    1 BAG = 20 KG

etc.

Use the existing UOM model where possible.

If the existing model is unnecessarily complicated, simplify it rather
than adding another conversion engine.

Do not create duplicate UOM/conversion tables without first inspecting
the current architecture.

============================================================ 21. BATCH / GRN INTEGRATION
============================================================

Review the existing GRN and Batch implementation.

When receiving a packaged product such as Tiles, the GRN should be able
to record:

    Product Variant
    Batch Number
    Received Packaging Quantity
    Packaging Conversion
    Equivalent Base Quantity

Example:

    Product:
    Kajaria Royal Gold 600 × 600

    Batch:
    KG-2026-001

    Received:
    100 BOX

    1 BOX:
    4 PCS

    Total:
    400 PCS

The conversion used for that receipt must remain associated with the
batch/receipt.

============================================================ 22. BATCH NUMBER
============================================================

Batch Number should remain an independent identifier of the actual
received lot.

Do NOT use the batch number as a replacement for Product Variant.

Relationship:

    Product Variant
        ↓
    Batch
        ↓
    Actual receipt information

The batch can contain packaging information specific to that batch.

============================================================ 23. AUTHORIZED USERS
============================================================

The Product Pricing & Packaging module must be permission controlled.

Recommended permission:

    product.pricing.manage

The exact permission naming should follow the project's existing
permission conventions.

Example:

    Organization Admin       → allowed
    Authorized Manager       → allowed
    Normal Staff             → denied

Do not hard-code the role name if the application already uses a
permission-based authorization architecture.

============================================================ 24. ORGANIZATION ISOLATION
============================================================

Pricing and current commercial packaging settings must be isolated by
organization.

Organization A must not see or modify:

    Organization B's

pricing or packaging settings.

The backend must enforce tenant isolation.

Do not rely solely on frontend filtering.

============================================================ 25. MENU INTEGRATION
============================================================

Add the new module to the existing navigation system according to the
project's current dynamic menu/permission architecture.

Do NOT use:

    config('permissions')

for authorization.

Use the existing database-backed permissions system.

The menu should only be visible to users who have the corresponding
permission.

Only the Super Admin is responsible for managing the permission/menu
definition itself.

============================================================ 26. RELATIONSHIP TO PRODUCT ENTRY
============================================================

The Product Entry form should NOT contain the full pricing and
packaging management interface.

After a product is created, an authorized user can go to:

    Product Pricing & Packaging

and configure:

    CP
    SP
    Current Packaging

This keeps Product Entry simple.

============================================================ 27. RELATIONSHIP TO PURCHASE ORDER
============================================================

Purchase Orders may specify their own commercial transaction values.

Do not make Purchase Orders dynamically depend on the current Product
Selling Price.

The Product Pricing & Packaging page provides the organization's
current/default commercial values.

When a Purchase Order is created:

    the transaction should capture the actual purchase price used.

Later changes to Product Pricing must not alter historical POs.

Also, do not assume that the current packaging conversion will always
match the packaging received in a future GRN.

============================================================ 28. RELATIONSHIP TO SALES
============================================================

Sales should be able to use the organization's current Selling Price
as a default where appropriate.

However, once a sale is completed:

    the actual price used

must be stored in the Sales transaction.

Changing the current Product Selling Price must not modify historical
sales.

============================================================ 29. PRODUCT VARIANT FORM AFTER THIS CHANGE
============================================================

The Add New Product Variant form should remain approximately:

    Add New Product

    1. Basic Information

       Product Name
       Brand
       Manufacturer
       Category

    2. Product Details

       Category-specific information

    3. Review & Save

Do NOT add:

    Product Type
    Inventory Behavior
    CP
    SP
    Pieces per Box

to this form unless there is a specific existing requirement that
cannot be handled elsewhere.

============================================================ 30. PRODUCT DETAILS EXAMPLES
============================================================

Tiles:

    Category
    Tiles

    Product Details
    Tile Size
    [ 2 × 4 ft ]

Granite:

    Category
    Granite Slab

    Product Details
    Length [ 8 ] Feet
    Width  [ 4 ] Feet
    Area   32 sq.ft.

Adhesive:

    Category
    Tile Adhesive

    Product Details
    Weight [ 20 ] KG

Sanitaryware:

    Category
    Wall Hung WC

    Product Details
    Colour
    Material
    Installation Type

The user does not see Product Type or Inventory Behavior.

============================================================ 31. PRODUCT VS COMMERCIAL DATA
============================================================

Maintain a clear conceptual separation:

    PRODUCT

    What is this product?

        Name
        Brand
        Manufacturer
        Category
        Product Details


    COMMERCIAL SETTINGS

    How does this organization currently buy/sell it?

        Cost Price
        Selling Price
        Price Basis
        Current Packaging


    BATCH

    What did we actually receive?

        Batch Number
        Receipt Quantity
        Actual Packaging
        Actual Conversion
        Receipt Date

This separation is mandatory.

============================================================ 32. DATABASE DESIGN
============================================================

Before creating new tables, inspect the existing database.

Determine whether an organization-specific pricing table already exists.

If not, introduce the minimum required structure.

Conceptually, the system may require something equivalent to:

    organization_product_pricing

containing information such as:

    id
    organization_id
    product_variant_id
    cost_price
    selling_price
    price_basis
    effective_from
    effective_to / current indicator
    timestamps

Use the project's existing naming conventions.

Do not blindly create these exact columns if equivalent structures
already exist.

For packaging, determine whether the existing inventory/batch schema
can hold:

    package UOM
    quantity per package
    base UOM

If not, add the minimum required fields/table.

Do not duplicate the UOM system.

============================================================ 33. HISTORICAL PRICING
============================================================

Design pricing so that historical prices can be preserved.

A simple approach may be:

    organization
        ↓
    product variant
        ↓
    pricing records
        ↓
    effective date

Example:

    Price Record 1
        Effective: 01-04-2026
        CP: ₹180
        SP: ₹250

    Price Record 2
        Effective: 01-08-2026
        CP: ₹190
        SP: ₹265

The current record should be unambiguous.

Prevent overlapping active pricing periods for the same organization
and Product Variant unless the existing architecture explicitly
supports them.

============================================================ 34. HISTORICAL PACKAGING
============================================================

Do not destroy historical packaging information.

If current packaging changes:

    4 PCS/BOX
        ↓
    2 PCS/BOX

existing batch records must continue to show:

    4 PCS/BOX

where that was the actual received packaging.

============================================================ 35. VALIDATION
============================================================

Backend validation must be authoritative.

Validate:

    Cost Price >= 0
    Selling Price >= 0

    Valid price basis

    Packaging quantity > 0

    Conversion quantity > 0

    Organization ownership

    Product Variant existence

Prevent unauthorized users from changing pricing.

Prevent one organization from modifying another organization's pricing.

============================================================ 36. AUDITABILITY
============================================================

Pricing changes are commercially significant.

If the existing application has audit logging, use it.

At minimum, retain:

    who changed the price
    when it changed
    previous value
    new value

Do not introduce a completely separate audit system if one already
exists.

============================================================ 37. TESTING
============================================================

Create/update tests covering:

1. Organization can configure Product Pricing.

2. Organization can configure Selling Price.

3. Organization can configure Cost Price.

4. Organization can configure current packaging where applicable.

5. Pricing is organization-specific.

6. Organization A cannot access Organization B's pricing.

7. Unauthorized staff cannot modify pricing.

8. Authorized users can modify pricing.

9. Tile pricing can be maintained per Piece.

10. Tile packaging can be maintained as Pieces per Box.

11. Granite pricing can be maintained per Sq.Ft.

12. Granite/Marble dimensional information remains separate from
    pricing.

13. Packaging changes do not create a new Product Variant.

14. Batch packaging can differ between batches.

15. Historical batch packaging is preserved.

16. Historical sales prices are not changed by current price updates.

17. Historical purchase prices are not changed by current price
    updates.

18. Product Entry does not require Product Type.

19. Product Entry does not require Inventory Behavior.

20. Product Entry does not require custom attribute definition.

21. Category-specific Product Details continue to work.

22. Existing Inventory functionality continues to work.

23. Existing GRN functionality continues to work.

24. Existing Purchase Order functionality continues to work.

25. Existing Sales functionality continues to work.

============================================================ 38. IMPORTANT REGRESSION CHECK
============================================================

This change must not break the existing workflow:

    Product
       ↓
    Purchase Order
       ↓
    GRN
       ↓
    Batch / Inventory
       ↓
    Stock
       ↓
    Sales

Verify that pricing and packaging information is used appropriately
without creating circular dependencies.

============================================================ 39. DO NOT REINTRODUCE PRODUCT FAMILY
============================================================

Product Family has already been removed.

Do NOT reintroduce it.

============================================================ 40. DO NOT REINTRODUCE GENERIC CUSTOM ATTRIBUTES
============================================================

The normal Product Entry form must remain category-driven.

Do NOT provide:

    Define Attribute
    Add Attribute
    Custom Attribute

to ordinary Product Entry users.

============================================================ 41. DO NOT REINTRODUCE USER-FACING PRODUCT TYPE
============================================================

Do NOT add:

    Product Type

back to the Product Entry form simply because the inventory engine
still uses it internally.

If required, derive it internally.

============================================================ 42. DO NOT REINTRODUCE USER-FACING INVENTORY BEHAVIOR
============================================================

Do NOT add:

    Inventory Behavior

to the Product Entry form.

If required internally, derive/configure it through the appropriate
system/category configuration.

============================================================ 43. FINAL USER EXPERIENCE
============================================================

The ordinary product-entry user should experience:

    Add Product

        Product Name
        Brand
        Manufacturer
        Category

        Product Details
            Size / Dimensions / Weight / etc.

        Save

Then an authorized commercial user can go to:

    Product Pricing & Packaging

and see:

        Product
        CP
        SP
        Packaging

For example:

    Kajaria Royal Gold 600 × 600

        CP: ₹180 / Piece
        SP: ₹250 / Piece
        1 Box = 4 Pieces

The user should never need to understand the underlying:

    Product Type
    Inventory Behavior
    UOM conversion engine
    Attribute engine

============================================================ 44. FINAL ARCHITECTURAL PRINCIPLE
============================================================

The system should follow this separation:

    PRODUCT
        ↓
    identifies WHAT the item is


    PRODUCT DETAILS
        ↓
    describes the item


    PRICING & PACKAGING
        ↓
    describes HOW THIS ORGANIZATION currently buys/sells it


    BATCH / GRN
        ↓
    records WHAT WAS ACTUALLY RECEIVED


    INVENTORY
        ↓
    records WHAT IS CURRENTLY IN STOCK


    SALES
        ↓
    records WHAT WAS ACTUALLY SOLD

Do not mix these responsibilities.

============================================================ 45. FINAL SUCCESS CRITERIA
============================================================

The implementation is successful when:

1. Add New Product Variant is significantly simpler.

2. Product Type is not shown to ordinary users.

3. Inventory Behavior is not shown to ordinary users.

4. Custom Attribute creation is not shown to ordinary users.

5. Product Category determines Product Details.

6. Tiles can be represented simply as:

    2 × 4 ft

7. Granite/Marble can be represented by:

    Length × Width

8. Area can be calculated automatically.

9. An organization can separately maintain:

    Cost Price
    Selling Price
    Current Packaging

10. Tile pricing can naturally be maintained per Piece.

11. Tile packaging can naturally be maintained as:

    1 Box = 4 Pieces

12. Packaging can change over time without creating another product.

13. Actual batch packaging can be recorded during GRN.

14. Historical batch packaging is preserved.

15. Historical transaction prices are preserved.

16. Pricing is organization-specific.

17. Pricing management is permission-controlled.

18. Product Entry remains understandable to a layman.

19. The database does not contain unnecessary duplicate pricing,
    packaging, UOM, or attribute systems.

20. Existing Purchase, GRN, Inventory and Sales functionality continues
    to work.

The final system should make the ordinary user think:

    "What is this product?"

and make the authorized commercial user think:

    "What is our current price and packaging?"

Neither user should be required to understand the internal technical
classification of the inventory system.
