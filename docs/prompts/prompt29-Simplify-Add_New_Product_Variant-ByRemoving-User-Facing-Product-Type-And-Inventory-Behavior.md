You are working on an existing Laravel + React ERP application for:

- Tiles
- Sanitaryware
- Granite
- Marble
- CP Fittings
- Adhesives
- Accessories
- Other building materials

This is an EXISTING application.

Before making any changes, thoroughly inspect the current implementation,
especially:

- ProductEntry.jsx / Add New Product Variant
- Product model
- ProductVariant model
- Product Type implementation
- Inventory Behavior implementation
- Product Category
- Brand
- Manufacturer
- Product Attributes / Specifications
- Category-Attribute relationships
- UOM / Unit implementation
- Inventory module
- GRN module
- Purchase Order module
- Sales module
- Product-related migrations
- Seeders
- APIs
- Requests / validation
- Existing services
- Existing React components

Do NOT blindly remove database fields or models.

The primary objective is to simplify the USER INTERFACE while
preserving the internal flexibility required by the ERP.

============================================================

1. # MAIN OBJECTIVE

The current "Add New Product Variant" form contains a section:

    4. Product Type & Inventory Behavior

This section is confusing for ordinary users.

Users should NOT have to understand or select:

    Product Type
    Inventory Behavior

during normal Product Variant creation.

REMOVE this section from the user-facing Product Variant form.

However:

IMPORTANT:

Do NOT immediately delete the underlying Product Type or Inventory
Behavior data structures from the database.

They may currently be required by:

- Inventory
- GRN
- Purchase Orders
- Sales
- Stock calculations
- Product processing
- Business rules

Instead, move the responsibility for determining these internal
behaviors away from the ordinary user.

The system should determine the appropriate internal behavior from
the Product Category and its configuration.

============================================================ 2. CORE PRINCIPLE
============================================================

The user should describe the REAL PRODUCT.

The system should determine HOW THE PRODUCT IS HANDLED INTERNALLY.

The user should think:

    "This is a 2 × 4 ft tile."

not:

    "This is a STANDARD product with a particular inventory behavior."

The user should think:

    "This is an 8 × 4 ft granite slab."

not:

    "This is a MEASURED_MATERIAL product."

The user should think:

    "This is a 20 KG tile adhesive."

not:

    "This is a WEIGHT_BASED inventory item."

Therefore:

    USER
      ↓
    Product information
      ↓
    Category
      ↓
    System determines internal behavior
      ↓
    Inventory / Purchasing / Sales

============================================================ 3. REMOVE FROM PRODUCT ENTRY UI
============================================================

Completely remove the following from the normal Add New Product Variant
form:

    Product Type selector

    Inventory Behavior selector

    Any explanatory text asking the user to choose an inventory
    behavior

    Any technical labels such as:

        STANDARD
        MEASURED_MATERIAL
        WEIGHT_BASED

unless they are genuinely required for a different business purpose.

Do not replace them with another technical selector.

Do not simply rename:

    Inventory Behavior

to another technical term.

The goal is to remove the decision from the ordinary user's workflow.

============================================================ 4. DO NOT REMOVE THE INTERNAL CONCEPT YET
============================================================

The existing Product Type and Inventory Behavior implementation must
first be audited.

Determine:

- Where Product Type is stored.
- Where Inventory Behavior is stored.
- Which tables reference them.
- Which services depend on them.
- Which inventory calculations depend on them.
- Whether GRN depends on them.
- Whether Purchase Orders depend on them.
- Whether Sales depends on them.
- Whether existing product variants contain these values.

If they are currently required internally, retain them.

The implementation should instead derive/populate them automatically.

Only remove obsolete database structures if inspection proves they are
no longer required anywhere in the application.

Do NOT break existing products.

============================================================ 5. CATEGORY BECOMES THE USER'S PRIMARY CLASSIFICATION
============================================================

The Product Category should become the important classification that
the ordinary user selects.

For example:

    Category:
    [ Tiles ]

or:

    Category:
    [ Granite Slab ]

or:

    Category:
    [ Tile Adhesive ]

The category should drive the Product Entry experience.

The user should not have to separately classify the inventory behavior.

============================================================ 6. CATEGORY CONFIGURATION
============================================================

The system should support a Super Admin configuration in which a
Product Category determines:

- Which Product Details are displayed
- Which specifications are required
- Which specifications are optional
- Which units apply
- Which data types apply
- Display order
- Appropriate internal product/inventory behavior where necessary

Conceptually:

    Category
       ↓
    Category Configuration
       ↓
    Product Entry UI
       ↓
    Internal Product Behavior

The Super Admin is responsible for establishing these rules.

The Organization Admin/staff only enters actual product information.

============================================================ 7. CATEGORY EXAMPLES
============================================================

Example:

    Category = Tiles

The system may internally know:

    Entry behavior = TILE_DIMENSION
    Inventory behavior = appropriate existing standard behavior

The user sees:

    Tile Size
    [ 2 × 4 ft ]

---

Example:

    Category = Granite Slab

The system may internally know:

    Entry behavior = SLAB_DIMENSION
    Inventory behavior = existing measured-material behavior

The user sees:

    Length [ 8 ] Feet
    Width  [ 4 ] Feet

    Area
    32 sq.ft.

---

Example:

    Category = Marble Slab

The system may internally know the same appropriate dimensional
behavior.

The user sees:

    Length [ 8 ] Feet
    Width  [ 4 ] Feet

---

Example:

    Category = Tile Adhesive

The system may internally know:

    Entry behavior = WEIGHT
    Inventory behavior = appropriate existing behavior

The user sees:

    Net Weight
    [ 20 ] KG

---

Example:

    Category = Wall Hung WC

The system may internally know the appropriate standard inventory
behavior.

The user sees only the configured Product Details, for example:

    Colour
    Material
    Installation Type

============================================================ 8. PRODUCT TYPE SHOULD BECOME INTERNAL
============================================================

If the existing Product Type is required by the business logic,
retain it internally.

However, it should no longer be selected manually during normal
Product Variant creation.

For example:

    Category = Granite Slab

may automatically assign:

    Product Type = MEASURED_MATERIAL

if that is how the existing system represents slab products.

The user should never need to know that this internal classification
exists.

The exact internal value must be determined from the existing project.

Do not invent new Product Type values unless necessary.

============================================================ 9. INVENTORY BEHAVIOR SHOULD BECOME DERIVED
============================================================

If the existing Inventory Behavior is required internally, it should
be determined automatically.

For example:

    Category:
        Granite Slab

could automatically result in the existing internal behavior:

    MEASURED_MATERIAL

while:

    Category:
        Tiles

could automatically result in the existing appropriate standard
behavior.

The exact mapping must be based on the current application's existing
implementation.

Do not hard-code assumptions without inspecting the codebase.

============================================================ 10. SUPER ADMIN CATEGORY CONFIGURATION
============================================================

The Super Admin should ultimately be able to configure the relationship
between:

    Product Category

and:

    Product Details / Specifications

and, where required:

    Internal Product/Inventory Behavior

For example:

    Tiles
        ↓
        Product Details:
            Tile Size

        Internal Behavior:
            existing standard behavior

---

    Granite Slab
        ↓
        Product Details:
            Length
            Width
            Calculated Area

        Internal Behavior:
            existing measured-material behavior

---

    Adhesive
        ↓
        Product Details:
            Net Weight

        Internal Behavior:
            existing appropriate behavior

The Organization user should never need to configure this relationship.

============================================================ 11. DO NOT EXPOSE TECHNICAL CONFIGURATION
============================================================

Do not expose the following to ordinary Product Entry users:

    Inventory Behavior
    Product Type
    Attribute Type
    Attribute UOM definition
    Attribute Data Type
    Attribute Mapping
    Category Specification Mapping

These belong to system configuration.

The user should see business-friendly labels such as:

    Tile Size
    Length
    Width
    Weight
    Colour
    Material
    Installation Type

============================================================ 12. PRODUCT ENTRY FORM — NEW STRUCTURE
============================================================

Redesign the form approximately as:

    Add New Product Variant

    1. Basic Information

       Product Name *
       [............................]

       Manufacturer
       [............................]

       Brand *
       [............................]

       Category *
       [............................]


    2. Product Details

       Category-specific fields appear here automatically.


    3. Commercial Information

       Purchase Price
       [............................]

       Selling Price
       [............................]


    4. Review & Save

Do not display:

    Product Type & Inventory Behavior

as a section.

Do not create an empty replacement section merely to preserve the
old numbering.

Renumber the sections naturally.

============================================================ 13. TILE PRODUCT ENTRY
============================================================

For:

    Category = Tiles

display:

    Product Details

    Tile Size *
    [ 2 × 4 ft ▼ ]

The user should be able to select common sizes such as:

    1 × 1 ft
    2 × 2 ft
    2 × 4 ft
    4 × 6 ft

The exact list should preferably come from configuration.

============================================================ 14. TILE DIMENSION STORAGE
============================================================

When the user selects:

    2 × 4 ft

the system must internally retain normalized values:

    length = 2
    width = 4
    dimension_unit = FT

Do not rely solely on:

    "2 × 4"

as an opaque text value.

The system must be able to calculate:

    2 × 4 = 8 sq.ft.

where required.

Do not make the user enter Length and Width separately for normal
standard tile sizes.

============================================================ 15. CUSTOM TILE SIZE
============================================================

Provide a simple:

    Custom Size

option if non-standard sizes are required.

Example:

    Tile Size
    [ Custom Size ▼ ]

Then display:

    Length [ 2.5 ] Feet
    Width  [ 4 ] Feet

Do not expose the generic attribute-definition mechanism.

============================================================ 16. GRANITE AND MARBLE
============================================================

For:

    Granite Slab
    Marble Slab

display:

    Product Details

    Length
    [ 8 ] Feet

    Width
    [ 4 ] Feet

    Area
    32.00 sq.ft.

Area must be calculated automatically.

The user must not manually enter Area.

The normalized dimensions must be stored appropriately.

============================================================ 17. SLAB QUANTITY VS AREA
============================================================

Do not confuse:

    Number of slabs

with:

    Area.

Example:

    Quantity = 1 slab

    Length = 8 ft
    Width = 4 ft

    Area = 32 sq.ft.

This information will later be used by Purchasing, GRN, Inventory,
and Sales according to their respective business rules.

Do not attempt to solve the entire Purchase Order UOM/pricing model
inside Product Variant creation.

============================================================ 18. ADHESIVE
============================================================

For:

    Tile Adhesive

display:

    Net Weight
    [ 20 ] KG

The user must not define:

    Attribute = Weight
    Unit = KG

The system already knows what information this category requires.

============================================================ 19. SANITARYWARE
============================================================

For Sanitaryware categories, display only the specifications configured
for the selected category.

Example:

    Colour
    [ White ▼ ]

    Material
    [ Ceramic ▼ ]

    Installation Type
    [ Wall Hung ▼ ]

Do not display dimensional fields unless configured for that category.

============================================================ 20. CATEGORY CHANGE
============================================================

When the user changes the Category:

    Tiles
        ↓
    Granite Slab

the Product Details section must update automatically.

Previous incompatible values must not be silently submitted as if they
belong to the new category.

Example:

    Tiles:
        Tile Size = 2 × 4 ft

User changes Category to:

    Adhesive

The system must not retain:

    Length = 2
    Width = 4

as Adhesive data.

Handle category changes safely.

============================================================ 21. PRODUCT FAMILY MUST NOT BE REINTRODUCED
============================================================

Product Family has already been removed from the application's
design.

Do NOT reintroduce:

    Product Family

into:

- Product Variant form
- Product model
- Product Variant model
- Category configuration
- Database
- API
- UI

============================================================ 22. CUSTOM ATTRIBUTES MUST NOT BE USER-DEFINED
============================================================

Do not reintroduce:

    Define Attribute

or:

    Add Custom Attribute

into the normal Product Variant form.

The underlying attribute/specification architecture may remain where
needed.

But ordinary users consume the specification configuration established
by the Super Admin.

============================================================ 23. USER RESPONSIBILITY
============================================================

The Organization Admin/staff user should only be responsible for:

    Selecting the category
    Entering product information
    Entering category-specific values
    Entering commercial information
    Saving the product

The user is NOT responsible for determining:

    Product Type
    Inventory Behavior
    Attribute Definition
    Unit Definition
    Category Specification Mapping

============================================================ 24. SUPER ADMIN RESPONSIBILITY
============================================================

The Super Admin is responsible for configuring:

    Product Categories
        ↓
    Category Specifications
        ↓
    Applicable Units
        ↓
    Required/Optional status
        ↓
    Display Order
        ↓
    Internal behavior mapping where required

This is a platform configuration concern.

============================================================ 25. INTERNAL FLEXIBILITY
============================================================

The system must remain flexible enough to support future categories.

For example, a future category:

    Paint

could be configured to show:

    Volume
    [ 20 ] L

without requiring a redesign of ProductEntry.jsx.

Another future category:

    Wallpaper

could be configured to show:

    Length
    Width

without adding a new hard-coded Product Type selector.

The goal is:

    NEW CATEGORY
        ↓
    CATEGORY CONFIGURATION
        ↓
    NEW PRODUCT ENTRY EXPERIENCE

rather than:

    NEW CATEGORY
        ↓
    MODIFY REACT CODE
        ↓
    MODIFY MULTIPLE BUSINESS RULES

============================================================ 26. REACT IMPLEMENTATION
============================================================

Refactor:

    ProductEntry.jsx

to remove the Product Type and Inventory Behavior inputs.

The component should obtain category-driven information from the
backend.

Avoid a large collection of hard-coded conditions such as:

    if category == TILE
    if category == GRANITE
    if category == ADHESIVE
    if category == WC

unless the existing architecture genuinely requires special behavior.

Prefer reusable components and configuration-driven rendering.

Potential reusable components:

    TileSizeSelector
    DimensionInput
    SpecificationField
    WeightInput

Do not over-engineer.

============================================================ 27. BACKEND IMPLEMENTATION
============================================================

The backend must determine the internal Product Type / Inventory
Behavior when necessary.

Do NOT trust the client to submit arbitrary:

    product_type
    inventory_behavior

values.

If these values are required internally, derive them server-side from
the category configuration.

For example:

    category_id
        ↓
    category configuration
        ↓
    internal behavior

The server remains authoritative.

============================================================ 28. API
============================================================

Inspect the existing Product Category API.

If necessary, provide an endpoint that returns the configuration
required to render the Product Details section.

Conceptually:

    GET /api/product-categories/{id}/configuration

The response may include:

    category
    specifications
    required/optional status
    data types
    units
    allowed values
    display order
    internal configuration where necessary

Do not expose unnecessary internal implementation details to the
frontend.

============================================================ 29. DATABASE
============================================================

Before modifying migrations, inspect the current database structure.

Determine whether the current system already has:

    product_types
    inventory_behaviors
    categories
    category specifications
    attributes
    attribute values
    UOM
    product variants

Reuse existing structures.

Do not create duplicate systems.

If the current database already contains:

    product_type_id
    inventory_behavior

retain them if they are used elsewhere.

If they can be derived from Category, implement the appropriate
relationship/configuration rather than forcing user selection.

============================================================ 30. MIGRATION SAFETY
============================================================

Do NOT drop:

    product_type
    inventory_behavior

columns/tables simply because they disappear from the UI.

First establish whether they are used by:

    Inventory
    GRN
    Purchase Orders
    Sales
    Reports
    Services
    APIs
    Existing Product Variants

If they are no longer needed after refactoring, remove them only through
a proper migration and data migration strategy.

Existing products must remain functional.

============================================================ 31. EXISTING PRODUCT DATA
============================================================

Existing Product Variants may already contain Product Type and/or
Inventory Behavior.

Do not invalidate them.

If the new category-driven model requires values to be populated,
provide a migration/backfill strategy.

Example:

    Existing Product Variant
        Category = Granite Slab
        Product Type = MEASURED_MATERIAL

must remain valid.

Do not overwrite existing valid data unnecessarily.

============================================================ 32. VALIDATION
============================================================

Backend validation must remain authoritative.

Validate:

    Product Name
    Brand
    Manufacturer where required
    Category
    Category-specific required specifications
    Numeric dimensions
    Numeric weights
    Commercial values

Do not allow users to submit incompatible category-specific data.

Do not rely only on React validation.

============================================================ 33. FORM NUMBERING
============================================================

After removing:

    Product Type & Inventory Behavior

renumber the remaining sections naturally.

Do NOT leave:

    4. Product Type & Inventory Behavior

as an empty section.

Do NOT keep:

    5. Specifications / Custom Attributes

as the replacement.

The new section should be:

    Product Details

and should dynamically display category-specific information.

============================================================ 34. EXAMPLE — FINAL TILE FORM
============================================================

The user should see something close to:

    Add New Product Variant

    1. Basic Information

       Product Name *
       [ Kajaria Oasis Beige ]

       Manufacturer
       [ Kajaria ]

       Brand *
       [ Kajaria ]

       Category *
       [ Tiles ]


    2. Product Details

       Tile Size *
       [ 2 × 4 ft ▼ ]


    3. Commercial Information

       Purchase Price
       [ ........ ]

       Selling Price
       [ ........ ]


       [ Cancel ]    [ Save Product ]

There should be NO:

    Product Type
    Inventory Behavior
    Define Attribute

fields.

============================================================ 35. EXAMPLE — FINAL GRANITE FORM
============================================================

    Add New Product Variant

    1. Basic Information

       Product Name
       [ Black Galaxy ]

       Manufacturer
       [ ........ ]

       Brand
       [ ........ ]

       Category
       [ Granite Slab ]


    2. Product Details

       Length
       [ 8 ] Feet

       Width
       [ 4 ] Feet

       Area
       32.00 sq.ft.


    3. Commercial Information

       Purchase Price
       [ ........ ]

       Selling Price
       [ ........ ]

No Product Type.

No Inventory Behavior.

No Custom Attribute builder.

============================================================ 36. EXAMPLE — FINAL ADHESIVE FORM
============================================================

    Category
    [ Tile Adhesive ]

    Product Details

    Net Weight
    [ 20 ] KG

The system internally handles the appropriate inventory behavior.

============================================================ 37. EXAMPLE — FINAL SANITARYWARE FORM
============================================================

    Category
    [ Wall Hung WC ]

    Product Details

    Colour
    [ White ▼ ]

    Material
    [ Ceramic ▼ ]

    Installation Type
    [ Wall Hung ▼ ]

Only configured information is displayed.

============================================================ 38. TESTING
============================================================

Create/update tests for:

1. Product Variant can be created without submitting Product Type from
   the frontend.

2. Product Variant can be created without submitting Inventory
   Behavior from the frontend.

3. Category determines the appropriate Product Details.

4. Required category specifications are enforced.

5. Optional category specifications can be omitted.

6. Tiles display Tile Size.

7. Tile Size is normalized into Length and Width.

8. Granite Slab displays Length and Width.

9. Marble Slab displays Length and Width.

10. Slab Area is calculated correctly.

11. Adhesive displays Weight.

12. Sanitaryware displays its configured specifications.

13. Changing Category updates Product Details.

14. Incompatible category-specific values are not retained incorrectly.

15. Internal Product Type is derived where required.

16. Internal Inventory Behavior is derived where required.

17. Client cannot arbitrarily assign an invalid Product Type.

18. Client cannot arbitrarily assign an invalid Inventory Behavior.

19. Existing Product Variants remain valid.

20. Existing inventory operations continue to work.

21. GRN continues to work.

22. Purchase Order continues to work.

23. Sales continues to work.

============================================================ 39. IMPORTANT REGRESSION TEST
============================================================

This change is primarily a UX simplification.

Therefore, after removing the fields from the UI, verify that existing
business behavior has NOT been broken.

Specifically test:

    Product
        ↓
    Purchase Order
        ↓
    GRN
        ↓
    Inventory
        ↓
    Sales

The internal classification must continue to produce the correct
behavior.

============================================================ 40. FINAL ARCHITECTURAL MODEL
============================================================

The desired architecture is:

                    SUPER ADMIN
                         │
                         ▼
                PRODUCT CATEGORY
                         │
                         ▼
             CATEGORY CONFIGURATION
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          DETAILS     UNIT RULES   INTERNAL
                                  BEHAVIOR
                                      │
                                      ▼
                              PRODUCT VARIANT
                                      │
                                      ▼
                           INVENTORY / PURCHASING
                                      │
                                      ▼
                                  SALES

The Organization user interacts primarily with:

    Product Category
    Product Details
    Commercial Information

The system handles:

    Product Type
    Inventory Behavior
    Specification configuration
    Unit configuration

internally.

============================================================ 41. FINAL PRINCIPLE
============================================================

The Product Variant form must NOT ask the user:

    "How should the system classify this product?"

Instead, it should ask:

    "What product are you adding?"

The user provides:

    Product
    Brand
    Manufacturer
    Category
    Size / Dimensions / Weight / other relevant details
    Commercial information

The system determines the appropriate internal behavior.

============================================================ 42. DO NOT OVER-SIMPLIFY THE DATABASE
============================================================

The objective is:

    SIMPLE USER EXPERIENCE

NOT:

    REMOVE EVERY INTERNAL CLASSIFICATION

Retain internal Product Type / Inventory Behavior concepts if they are
needed by the ERP.

Hide them from the ordinary Product Variant form and derive them
automatically where possible.

============================================================ 43. FINAL SUCCESS CRITERIA
============================================================

The implementation is successful when:

1. "Product Type & Inventory Behavior" is completely removed from the
   Add New Product Variant UI.

2. Ordinary users do not select Product Type.

3. Ordinary users do not select Inventory Behavior.

4. "Specifications / Custom Attributes" is not used as a free-form
   attribute builder.

5. Product Category drives Product Details.

6. Tiles provide a simple Tile Size such as:

    2 × 4 ft

7. Tile dimensions are stored internally as normalized values.

8. Granite and Marble provide Length × Width.

9. Slab Area is calculated automatically.

10. Adhesive can provide Weight.

11. Sanitaryware can provide category-specific characteristics.

12. Product Type, if still required internally, is derived rather than
    manually selected.

13. Inventory Behavior, if still required internally, is derived rather
    than manually selected.

14. Existing Inventory, GRN, Purchase Order and Sales functionality
    continues to work.

15. Product Family is NOT reintroduced.

16. The underlying attribute/specification engine is not unnecessarily
    duplicated or destroyed.

17. The normal Product Entry form is understandable to a layman.

18. The system remains flexible enough for future categories without
    requiring users to understand technical inventory concepts.
