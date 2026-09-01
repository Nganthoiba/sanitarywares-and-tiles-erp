You are working on an existing Laravel + React ERP application for
Tiles, Sanitaryware, Granite, Marble, CP Fittings, Adhesives and other
building materials.

This is an EXISTING application.

The immediate objective is to implement a simple and user-friendly way
to record how many individual pieces are contained in one box for
products belonging to the Tiles category.

============================================================

1. # BUSINESS REQUIREMENT

For tile products, users commonly purchase, receive, stock and sell
tiles in different units.

For example:

    1 BOX = 4 PCS

or:

    1 BOX = 6 PCS

or:

    1 BOX = 8 PCS

The number of pieces contained in a box varies from one tile product
to another.

Therefore, the system must store the relationship for each applicable
tile product/variant.

Example:

    Kajaria Oasis Beige
    Size: 2 × 4 ft
    Pieces per Box: 4

This means:

    1 BOX = 4 PCS

============================================================ 2. IMPORTANT UX DECISION
============================================================

DO NOT implement "Pieces per Box" as a user-defined Custom Attribute.

Do NOT make the user:

    Define Attribute
    → enter "Pieces per Box"
    → select Attribute Type
    → select Unit
    → enter Value

That approach has already been rejected because it is too complicated
for ordinary users.

Instead, "Pieces per Box" must be a dedicated, business-friendly
field associated with the Tiles category.

The user should simply see:

    Pieces per Box
    [ 4 ]

The user should not need to understand:

    UOM Conversion
    Conversion Factor
    Attribute Definition
    Inventory Behavior

============================================================ 3. TILE PRODUCT ENTRY
============================================================

When the user selects:

    Category = Tiles

the Product Entry form should display:

    Product Details

        Tile Size
        [ 2 × 4 ft ▼ ]

    Packaging

        Pieces per Box
        [ 4 ]

The UI should clearly communicate that this means:

    1 Box contains 4 Pieces

Prefer the label:

    Pieces per Box

rather than:

    Box Conversion Factor

or:

    UOM Conversion Factor.

============================================================ 4. EXAMPLE
============================================================

User enters:

    Product:
        Kajaria Oasis Beige

    Category:
        Tiles

    Tile Size:
        2 × 4 ft

    Pieces per Box:
        4

The system must understand:

    1 BOX = 4 PCS

The user does NOT need to enter:

    Box
    PCS
    Conversion Ratio

The system already knows that the field represents:

    BOX → PCS

============================================================ 5. THIS IS NOT A GLOBAL CONVERSION
============================================================

IMPORTANT:

Do NOT create a global rule such as:

    1 BOX = 4 PCS

because different tile products can contain different numbers of
pieces per box.

For example:

    Tile A:
        1 BOX = 4 PCS

    Tile B:
        1 BOX = 6 PCS

    Tile C:
        1 BOX = 8 PCS

All must be supported simultaneously.

Therefore, the pieces-per-box value belongs to the applicable
tile product/variant, not to the global UOM definition.

============================================================ 6. DO NOT MODIFY GLOBAL UOM SEMANTICS
============================================================

Do NOT make:

    BOX

globally equivalent to a fixed number of:

    PCS.

BOX and PCS remain independent units.

The relationship:

    BOX → PCS

is established only for the applicable tile product/variant.

The global UOM system should continue to represent units independently.

============================================================ 7. PRODUCT VARIANT LEVEL
============================================================

Inspect the existing Product/Product Variant architecture before
deciding where to store the value.

The value must be associated with the entity that represents the
specific commercial/stockable tile item.

If Product Variant represents the actual stockable product, prefer:

    product_variant.pieces_per_box

or an equivalent normalized structure.

Do NOT duplicate the value unnecessarily between Product and Product
Variant.

Use the existing project's architecture to determine the correct
location.

============================================================ 8. WHY THIS BELONGS TO THE TILE VARIANT
============================================================

The same base product may have different variants.

For example:

    Kajaria Oasis Beige
        1 × 1 ft
            1 BOX = 10 PCS

        2 × 2 ft
            1 BOX = 4 PCS

        2 × 4 ft
            1 BOX = 2 PCS

Therefore, if the current Product Variant model represents the actual
stockable item, Pieces per Box should belong to the Product Variant.

Do not assume that all variants of a product have the same packaging
unless the existing business model guarantees it.

============================================================ 9. VALIDATION
============================================================

For Tiles:

    Pieces per Box must be a positive whole number.

Valid:

    1
    2
    4
    6
    8
    10
    12

Invalid:

    0
    -1
    2.5
    "four"

Use appropriate backend validation.

Frontend validation may provide immediate feedback, but backend
validation remains authoritative.

============================================================ 10. REQUIRED OR OPTIONAL?
============================================================

For the Tiles category, determine whether Pieces per Box should be
required based on the application's actual purchasing/inventory
requirements.

Recommended behavior:

    If the tile is normally sold/purchased by box:
        Pieces per Box = Required

    If the tile is only handled as individual pieces:
        Pieces per Box = Optional

However, do not introduce a second complicated selection asking the
user whether the product is box-based.

Prefer to derive the requirement from the category/commercial
configuration where possible.

If the current system requires every tile to have packaging information,
make Pieces per Box required for Tiles.

The final implementation should avoid unnecessary questions.

============================================================ 11. CATEGORY-DRIVEN DISPLAY
============================================================

Pieces per Box should only appear for categories where it makes
business sense.

For example:

    Category = Tiles

Show:

    Pieces per Box

For:

    Granite Slab

Do NOT show:

    Pieces per Box

For:

    Marble Slab

Do NOT show:

    Pieces per Box

For:

    Adhesive

Do NOT show:

    Pieces per Box

unless that category is explicitly configured to use the same packaging
concept.

The UI must remain category-aware.

============================================================ 12. PACKAGING IS DIFFERENT FROM PRODUCT DETAILS
============================================================

Keep the concepts separate.

For Tiles:

    Product Details
        Size
            2 × 4 ft

    Packaging
        Pieces per Box
            4

This is preferable to putting everything into:

    Specifications / Custom Attributes.

The user should understand:

    Size = what the tile physically is

    Pieces per Box = how the tile is packaged

============================================================ 13. RELATIONSHIP WITH TILE AREA
============================================================

The system should be able to derive useful information from:

    Tile Length
    Tile Width
    Pieces per Box

Example:

    Tile Size:
        2 × 4 ft

    Area per piece:
        8 sq.ft.

    Pieces per Box:
        4

Therefore:

    Area per Box:
        32 sq.ft.

The application may calculate:

    area_per_piece
    area_per_box

where required.

Do not require the user to enter these calculated values manually.

============================================================ 14. DO NOT STORE CALCULATED VALUES UNNECESSARILY
============================================================

The authoritative values should be:

    Length
    Width
    Dimension Unit
    Pieces per Box

The system can calculate:

    Area per Piece
    Area per Box

when needed.

Avoid storing duplicate calculated values unless the existing
application has a clear reason to persist them.

If calculated values are persisted for performance/reporting, ensure
they are derived consistently from the authoritative values.

============================================================ 15. PURCHASE ORDER RELATIONSHIP
============================================================

This change must integrate cleanly with the Purchase Order design.

For example:

    Product:
        Kajaria Oasis Beige

    Size:
        2 × 4 ft

    Pieces per Box:
        4

During purchasing, the user may order:

    10 BOX

The system knows:

    10 BOX × 4 PCS
        =
    40 PCS

And because each tile is:

    2 × 4 ft

the system can derive:

    40 PCS × 8 sq.ft.
        =
    320 sq.ft.

Do not force the Purchase Order form to ask the user to define the
relationship again.

The product's packaging configuration should provide the necessary
conversion information.

============================================================ 16. PURCHASE UNIT AND PRICING UNIT
============================================================

Do NOT solve all Purchase Unit / Pricing Unit logic in this change.

This prompt only establishes the product's packaging relationship:

    1 BOX = N PCS

The Purchase Order module may later allow the user to purchase in:

    BOX

while pricing may be based on:

    SQ.FT.

or another appropriate unit.

That is a transaction-level concern.

Do not introduce additional complexity into Product Entry merely to
solve this.

============================================================ 17. GRN RELATIONSHIP
============================================================

The GRN should be able to use the product's packaging relationship.

Example:

    Ordered:
        10 BOX

    Pieces per Box:
        4

    Ordered pieces:
        40 PCS

If the GRN records:

    Received:
        8 BOX

the system can derive:

    8 BOX × 4 PCS
        =
    32 PCS

The GRN may still need to support receiving in the appropriate unit
according to the existing GRN design.

Do not duplicate packaging configuration unnecessarily inside GRN.

============================================================ 18. INVENTORY RELATIONSHIP
============================================================

Inspect the existing inventory model before implementing conversion.

The inventory system should have a clear normalized approach to stock
quantity.

For example, if the system chooses PCS as the base inventory quantity
for tiles:

    1 BOX = 4 PCS

then:

    10 BOX
        =
    40 PCS

The actual implementation must follow the existing inventory
architecture.

Do NOT introduce a second independent UOM conversion system.

============================================================ 19. SALES RELATIONSHIP
============================================================

The same relationship may later be useful during Sales.

Example:

    Product:
        Kajaria Oasis Beige
        2 × 4 ft

    Packaging:
        1 BOX = 4 PCS

If the customer buys:

    2 BOX

the system knows:

    2 BOX = 8 PCS

If sales pricing is based on sq.ft., it can derive:

    8 PCS × 8 sq.ft.
        =
    64 sq.ft.

Again, do not redesign the Sales module as part of this prompt unless
required to prevent a regression.

============================================================ 20. DATABASE IMPLEMENTATION
============================================================

Inspect the existing schema first.

Determine whether there is already:

    packaging
    package_size
    conversion_factor
    pieces_per_box
    UOM conversion

logic.

If an appropriate existing field already exists, reuse it.

If no suitable field exists, create a focused migration.

Preferred conceptual field:

    pieces_per_box

Use an appropriate integer type because the value represents a count
of physical pieces.

Do not use a generic decimal attribute-value field for this business
property if a dedicated field is appropriate.

============================================================ 21. API
============================================================

Update the Product Variant create/update API so that:

    pieces_per_box

can be supplied for applicable tile products.

The backend must:

- Validate it.
- Store it correctly.
- Return it when retrieving the Product Variant.
- Prevent it from being accepted for inappropriate categories if the
  application's business rules require that restriction.

The backend must not trust the frontend to determine whether the
category is a Tiles category.

============================================================ 22. REACT IMPLEMENTATION
============================================================

Update ProductEntry.jsx / Add New Product Variant.

Remove the old:

    Specifications / Custom Attributes

free-form entry mechanism as already specified.

When:

    Category = Tiles

render:

    Product Details

        Tile Size
        [ 2 × 4 ft ▼ ]

    Packaging

        Pieces per Box
        [ 4 ]

When the category changes away from Tiles:

    Hide Pieces per Box

and ensure the old tile-specific value is not incorrectly submitted
for the new category.

============================================================ 23. USER-FACING TERMINOLOGY
============================================================

Use simple terminology.

Preferred:

    Pieces per Box

Avoid:

    Conversion Factor
    UOM Conversion
    Base UOM
    Inventory Conversion
    Packaging Conversion Ratio

The user should understand the field immediately.

Optionally display a short helper text:

    "Number of individual tiles contained in one box."

This is acceptable and helpful.

============================================================ 24. DO NOT ASK THE USER TO ENTER THE RELATIONSHIP
============================================================

Do not provide:

    From Unit:
    [ BOX ]

    To Unit:
    [ PCS ]

    Conversion:
    [ 4 ]

This is technically correct but unnecessarily complicated.

Instead:

    Pieces per Box
    [ 4 ]

Internally:

    BOX → PCS
    factor = 4

============================================================ 25. PRODUCT FORM EXAMPLE
============================================================

The final Tiles form should look approximately like:

    Add Product

    Product Name
    [ Kajaria Oasis Beige ]

    Manufacturer
    [ Kajaria ]

    Brand
    [ Kajaria ]

    Category
    [ Tiles ]

    Product Details
    ────────────────────────────

    Tile Size
    [ 2 × 4 ft ▼ ]


    Packaging
    ────────────────────────────

    Pieces per Box
    [ 4 ]

    "1 box contains 4 pieces."


    Commercial Information
    ────────────────────────────

    Purchase Price
    [ ........ ]

    Selling Price
    [ ........ ]


    [ Cancel ]       [ Save Product ]

There should be no:

    Product Type
    Inventory Behavior
    Define Attribute
    Custom Attribute
    UOM Conversion Factor

fields.

============================================================ 26. NON-TILE EXAMPLE
============================================================

For:

    Category = Granite Slab

The form should show:

    Product Details

    Length
    [ 8 ] Feet

    Width
    [ 4 ] Feet

    Area
    32.00 sq.ft.

It should NOT show:

    Pieces per Box

============================================================ 27. DATA INTEGRITY
============================================================

Enforce the relationship consistently.

If:

    pieces_per_box = 4

then the application must always interpret:

    1 BOX = 4 PCS

Do not allow different modules to independently define another
conversion for the same Product Variant.

The Product/Variant packaging configuration should be the source of
truth for this relationship.

============================================================ 28. EXISTING DATA
============================================================

If existing Tile Product Variants already exist, determine how they
should be handled.

Do not make existing products invalid.

If Pieces per Box is newly introduced and existing values are unknown:

    Allow NULL initially

or provide an appropriate migration/default strategy based on the
existing data.

Do NOT blindly assume:

    1 BOX = 1 PCS

or:

    1 BOX = 4 PCS

for existing products.

Unknown packaging information must remain unknown until correctly
configured.

============================================================ 29. TESTING
============================================================

Create/update tests covering:

1. Tile Product Variant can store Pieces per Box.

2. Pieces per Box accepts only positive integers.

3. Zero is rejected.

4. Negative values are rejected.

5. Decimal values are rejected.

6. Granite Slab does not require Pieces per Box.

7. Marble Slab does not require Pieces per Box.

8. Adhesive does not require Pieces per Box.

9. Tile Size and Pieces per Box can coexist.

10. A tile with:
    2 × 4 ft
    4 pieces per box

    correctly represents:
    1 BOX = 4 PCS.

11. Area per piece can be calculated correctly.

12. Area per box can be calculated correctly where required.

13. Purchase Order calculations can use the packaging relationship.

14. GRN calculations can use the packaging relationship.

15. Inventory calculations do not create a second conflicting
    conversion.

16. Sales calculations can use the packaging relationship where
    applicable.

17. Existing products remain valid.

18. Changing category does not incorrectly preserve tile packaging
    information for a non-tile product.

============================================================ 30. IMPORTANT ARCHITECTURAL RULE
============================================================

Do NOT treat:

    Pieces per Box

as a generic Product Attribute.

It is a specific packaging relationship:

    BOX → PCS

and should be represented explicitly.

However, do not create a completely new generic Packaging Engine unless
the existing architecture genuinely requires one.

Use the simplest structure that supports the current business
requirement and can be extended later.

============================================================ 31. FUTURE EXTENSIBILITY
============================================================

The design should allow future packaging relationships such as:

    1 PACK = 10 PCS

    1 CARTON = 12 PCS

    1 BUNDLE = 20 PCS

without making the Tile Product Entry form complicated.

However, DO NOT implement a generalized packaging engine unless it is
already present or clearly necessary.

For the current requirement, implement:

    Pieces per Box

for Tiles.

Keep the design extensible but simple.

============================================================ 32. FINAL DESIGN PRINCIPLE
============================================================

The user should think:

    "This tile box contains 4 pieces."

The system should internally understand:

    BOX → PCS
    conversion factor = 4

The user should NOT have to think:

    "I need to define a UOM conversion."

============================================================ 33. FINAL SUCCESS CRITERIA
============================================================

The implementation is successful when:

1.  Tiles have a simple "Pieces per Box" input.

2.  The field is displayed only when applicable.

3.  It is NOT implemented as a Custom Attribute.

4.  The user does not define BOX → PCS manually.

5.  The system internally knows:
    1 BOX = N PCS

6.  Different tile variants can have different Pieces per Box values.

7.  BOX remains a global unit, not a globally fixed number of pieces.

8.  The value is stored against the appropriate Product Variant/product
    entity.

9.  Tile dimensions remain separate from packaging information.

10. Tile area calculations can use the dimensions.

11. Box calculations can use Pieces per Box.

12. Purchase Order, GRN, Inventory and Sales can consume the
    relationship without redefining it.

13. No duplicate UOM conversion mechanism is introduced.

14. Existing data is preserved.

15. The Product Entry UI remains understandable to a layman.

16. The user sees business terminology:

        Tile Size
        Pieces per Box

    rather than technical terminology:

        Product Type
        Inventory Behavior
        Attribute
        UOM Conversion
        Conversion Factor
