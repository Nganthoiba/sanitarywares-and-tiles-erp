You are working on an existing Laravel + React ERP application for
Tiles, Sanitaryware, Granite, Marble, CP Fittings, Adhesives and other
building materials.

This is an EXISTING application.

Before making changes, inspect the existing implementation of:

- ProductEntry.jsx / Add Product Wizard
- Product model
- ProductVariant model
- Product Type
- Product Category
- Brand
- Manufacturer
- Product Attributes
- Attribute Values
- UOM / Units
- Product specification tables
- Product variant migrations
- Category migrations
- Existing APIs
- Existing validation
- Existing seeders
- Existing Product Catalog & Specification Engine

Do not create a parallel product/attribute architecture.

The objective is to SIMPLIFY the user experience while retaining the
necessary flexibility in the database.

============================================================

1. # MAIN OBJECTIVE

Redesign the:

    "Add New Product Variant"

form.

The current form contains:

    "5. Specifications / Custom Attributes — Optional"

where the user can freely define attributes.

REMOVE this concept from the normal Product Variant entry experience.

A normal Organization Admin / staff user should NOT be required to
understand:

- Attribute
- Custom Attribute
- Attribute Definition
- Attribute UOM
- Attribute Data Type
- Define Attribute
- Add Attribute

The user should simply enter the information that is naturally
understood for the selected product category.

The form must be CATEGORY-AWARE.

============================================================ 2. CORE UX PRINCIPLE
============================================================

The user should enter:

    BUSINESS INFORMATION

not:

    DATABASE ATTRIBUTE DEFINITIONS

The principle is:

    SUPER ADMIN
        ↓
    defines what information a category requires
        ↓
    PRODUCT ENTRY FORM
        ↓
    automatically displays appropriate fields
        ↓
    ORGANIZATION USER
        ↓
    enters actual values

The Organization user must NOT decide what attributes a product
category requires during normal Product Variant creation.

============================================================ 3. REMOVE USER-FACING CUSTOM ATTRIBUTE BUILDER
============================================================

Remove from the Add New Product Variant form:

    Specifications / Custom Attributes — Optional

and remove:

    Define Attribute
    Add Attribute
    Attribute Name
    Attribute Type
    Attribute Unit

from the normal product-entry workflow.

Do not display an empty custom-attribute builder.

Do not ask the user:

    "What attributes does this product have?"

The system should already know this from the selected Product Category.

============================================================ 4. DO NOT NECESSARILY REMOVE THE UNDERLYING ATTRIBUTE ENGINE
============================================================

IMPORTANT:

The underlying database attribute/specification capability should NOT
automatically be deleted merely because it is removed from the user
interface.

If the existing attribute architecture is useful for storing
category-specific specifications, retain and refactor it.

The major change is:

    REMOVE COMPLEXITY FROM THE NORMAL USER EXPERIENCE.

The attribute configuration belongs to the Super Admin/category
configuration layer.

The Product Variant entry form consumes that configuration.

============================================================ 5. CATEGORY-DRIVEN SPECIFICATIONS
============================================================

The Super Admin must be able to establish which specifications are
applicable to a Product Category.

Conceptually:

    Product Category
          ↓
    Category Specifications
          ↓
    Product Entry Form

Examples:

    Tiles
        → Length
        → Width

    Granite Slab
        → Length
        → Width

    Marble Slab
        → Length
        → Width

    Tile Adhesive
        → Net Weight

    Sanitaryware
        → Colour
        → Material
        → Installation Type

The exact attributes should come from the application's configured
category/specification data.

Do not hard-code every possible attribute into ProductEntry.jsx if the
existing architecture can provide the configuration dynamically.

============================================================ 6. TILE ENTRY MUST BE EXTREMELY SIMPLE
============================================================

Tiles are a special and very common case.

A normal user thinks of tile dimensions as:

    1 × 1
    2 × 2
    2 × 4
    4 × 6

rather than:

    Length = 2
    Width = 4
    Unit = Feet

Therefore the Product Variant form for a Tile should primarily display:

    Tile Size

For example:

    Tile Size *
    [ 2 × 4 ft ▼ ]

The user should be able to select a familiar size.

============================================================ 7. STANDARD TILE SIZES
============================================================

The system should support predefined tile sizes.

Examples:

    1 × 1 ft
    2 × 2 ft
    2 × 4 ft
    4 × 6 ft

The exact available sizes should preferably be configurable rather
than hard-coded.

The UI should present them in a simple dropdown/searchable selector.

Example:

    Tile Size *
    ┌─────────────────────────────┐
    │ 2 × 4 ft                  ▼ │
    └─────────────────────────────┘

Do not force the user to manually enter Length and Width for common
standard tile sizes.

============================================================ 8. INTERNAL TILE DIMENSION STORAGE
============================================================

Although the user sees:

    2 × 4 ft

the database must retain normalized dimensional values.

For example:

    display size:
        2 × 4 ft

    length:
        2

    width:
        4

    dimension unit:
        FT

Do NOT store only:

    "2 × 4"

as an opaque text value if the existing schema supports normalized
dimensions.

The application must be able to perform calculations later.

For example:

    2 × 4 ft
        =
    8 sq.ft. per tile

Do not duplicate derived values unnecessarily if they can be reliably
calculated from normalized dimensions.

============================================================ 9. TILE CUSTOM SIZE
============================================================

Provide a simple fallback for non-standard tile sizes.

For example:

    Tile Size *
    [ 2 × 4 ft ▼ ]

and an option:

    Custom Size

When the user selects Custom Size, display:

    Length
    [ 2.5 ]

    Width
    [ 4 ]

    Unit
    [ Feet ]

The normal user should only encounter this when necessary.

Do not expose the complete attribute-definition system.

============================================================ 10. GRANITE SLAB
============================================================

Granite Slab should use a dimensional entry interface.

Example:

    Category:
    Granite Slab

    Slab Dimensions

    Length
    [ 8 ] Feet

    Width
    [ 4 ] Feet

    Area
    [ 32.00 ] sq.ft.

The Area must be calculated automatically.

The user must NOT manually enter Area.

Calculation:

    Area = Length × Width

The calculated area should be clearly marked as calculated/read-only.

============================================================ 11. MARBLE SLAB
============================================================

Marble Slab should follow the same dimensional concept as Granite Slab.

Example:

    Category:
    Marble Slab

    Length
    [ 8 ] Feet

    Width
    [ 4 ] Feet

    Area
    32.00 sq.ft.

Do not create separate arbitrary attribute-definition workflows for
Granite and Marble if the existing category specification architecture
can represent their dimensional requirements.

============================================================ 12. IMPORTANT: SLAB QUANTITY VS AREA
============================================================

Do not confuse:

    Number of slabs

with:

    Area

For example:

    Quantity = 1 SLAB

    Length = 8 FT
    Width = 4 FT

    Area = 32 SQ.FT.

The product entry form should preserve the dimensional information.

Later, during Purchase Order / GRN processing, the application can
handle:

    slabs purchased
    versus
    square feet priced/received

according to the purchasing model.

Do not try to solve the entire Purchase Order UOM/pricing problem
inside Product Variant creation.

============================================================ 13. ADHESIVE
============================================================

For a category such as:

    Tile Adhesive

the form should display the relevant product information.

For example:

    Product Details

    Net Weight *
    [ 20 ] KG

Do not display:

    Define Attribute

or:

    Attribute Name = Weight
    Attribute Unit = KG

The user simply enters:

    20 KG

============================================================ 14. SANITARYWARE
============================================================

For categories such as Sanitaryware, display only the specifications
configured for that category.

Example:

    Product Details

    Colour
    [ White ▼ ]

    Material
    [ Ceramic ▼ ]

    Installation Type
    [ Wall Hung ▼ ]

Do not display Length/Width merely because those fields exist in the
system.

The form must be driven by category requirements.

============================================================ 15. REQUIRED VS OPTIONAL SPECIFICATIONS
============================================================

The Super Admin's category specification configuration must support
whether a specification is:

    REQUIRED

or:

    OPTIONAL

Example:

    Tiles

        Length/Width
            Required

    Sanitaryware

        Colour
            Optional

        Material
            Optional

The Product Entry form must visually distinguish required fields.

Required fields must be validated by the backend.

Optional fields may be left blank.

============================================================ 16. SPECIFICATION DISPLAY ORDER
============================================================

The category specification configuration should also determine the
display order.

Example:

    Sanitaryware

        Colour
        Material
        Installation Type

The Product Entry form must follow that configured order.

Do not hard-code the order independently in React if it can be
obtained from the category specification configuration.

============================================================ 17. UNITS MUST BE CATEGORY/SPECIFICATION AWARE
============================================================

The user should not have to choose arbitrary units for every
specification.

For example:

    Tile Length
        FT

    Tile Width
        FT

    Granite Slab Length
        FT

    Granite Slab Width
        FT

    Adhesive Weight
        KG

The unit should come from the configured specification/category
definition wherever appropriate.

Display the unit clearly beside the field.

Example:

    Length
    [ 2.00 ] Feet

Do not make the user understand unit-conversion mechanics unless
required.

============================================================ 18. NO UNIT
============================================================

Some specifications do not require a physical unit.

Examples:

    Colour
    Finish
    Installation Type
    Material
    Model Name

The underlying specification system must support:

    NO UNIT

when appropriate.

Do not force a unit on every specification.

However, the normal Product Variant user should not have to configure
this.

The Super Admin/category configuration determines whether a unit is
required.

============================================================ 19. DATA TYPES
============================================================

The underlying specification system may support appropriate data types
such as:

    Text
    Number
    Decimal
    Boolean
    Selection

Use the existing implementation if available.

The Product Entry form should render the correct control automatically.

Examples:

    Colour
        → dropdown/select

    Length
        → numeric input

    Weight
        → numeric input

    Installation Type
        → dropdown/select

Do not expose "Data Type" configuration to ordinary Product Variant
users.

============================================================ 20. PRODUCT ENTRY FORM STRUCTURE
============================================================

Redesign the Add New Product Variant form to be simple.

Recommended structure:

    1. Basic Product Information

    2. Brand & Category

    3. Product Identification

    4. Commercial Information

    5. Product Details

    6. Review & Save

Do not use:

    Specifications / Custom Attributes — Optional

as a visible section title.

Use:

    Product Details

for category-specific information.

============================================================ 21. BASIC PRODUCT INFORMATION
============================================================

Retain appropriate existing fields such as:

    Product Name
    Brand
    Manufacturer
    Category
    Product Type

Use the existing project terminology.

Do not duplicate fields already captured elsewhere.

============================================================ 22. CATEGORY SELECTION
============================================================

Category is a critical input.

When the user selects:

    Tiles

the Product Details section must update.

When the user changes to:

    Granite Slab

the Product Details section must update.

When the user changes to:

    Adhesive

the Product Details section must update.

When the category changes:

    Clear or appropriately reconcile previously entered
    category-specific values.

Do not silently retain incompatible specification values from the
previous category.

============================================================ 23. PRODUCT TYPE
============================================================

Retain the existing Product Type concept if it is already part of the
application.

Do not reintroduce Product Family.

Product Family has already been removed from the system design.

Do not add Product Family back into the form, database, or workflow.

Product Type and Product Category should not be treated as the same
concept.

Use their existing semantics.

============================================================ 24. PRODUCT VARIANT
============================================================

The Product Variant represents the actual sellable/stockable product
variant.

Examples:

    Kajaria Oasis Beige — 2 × 4 ft

    Black Galaxy Granite — 8 × 4 ft

    Tile Adhesive — 20 KG

The product variant record should contain the normalized values
required by the application.

============================================================ 25. DISPLAY NAME / DESCRIPTION
============================================================

Where appropriate, the system may generate a human-readable variant
description.

For example:

    Kajaria Oasis Beige
    2 × 4 ft

or:

    Black Galaxy Granite
    8 × 4 ft

Do not force the user to manually type information already captured
through structured fields.

============================================================ 26. DO NOT DUPLICATE DIMENSION DATA
============================================================

If the tile size is:

    2 × 4 ft

do not store independently:

    size_text = "2 × 4 ft"
    length = 2
    width = 4

unless the text is intentionally a display/cache field.

Prefer normalized values as the authoritative data.

The display string can be generated when needed.

============================================================ 27. VALIDATION
============================================================

Backend validation must remain authoritative.

Examples:

Tiles:

    Length > 0
    Width > 0

Granite/Marble:

    Length > 0
    Width > 0

Adhesive:

    Weight > 0

Required category specifications:

    must be provided.

Optional specifications:

    may be empty.

Use appropriate numeric precision based on the existing database
schema.

Do not rely only on React validation.

============================================================ 28. CATEGORY-SPECIFICATION API
============================================================

Inspect existing APIs first.

If an appropriate endpoint does not exist, provide an API that can
return the specifications applicable to a selected category.

Conceptually:

    GET /api/product-categories/{id}/specifications

The response should contain only the information required by the
Product Entry UI, such as:

    specification name
    data type
    required/optional
    unit
    allowed values
    display order
    applicable behavior

Do not expose unnecessary internal configuration.

Use the project's existing API conventions if different.

============================================================ 29. REACT IMPLEMENTATION
============================================================

Refactor ProductEntry.jsx.

Do not create a giant collection of hard-coded:

    if category == ...

blocks if the existing database configuration can drive the form.

The React component should:

1. Load category information.
2. Load category specifications.
3. Render appropriate controls.
4. Render units appropriately.
5. Validate required values.
6. Submit normalized values.
7. Handle category changes safely.

Use reusable components where appropriate.

For example:

    SpecificationField
    DimensionField
    TileSizeSelector

Do not over-engineer the component hierarchy.

============================================================ 30. TILE SIZE COMPONENT
============================================================

Implement a simple reusable Tile Size input.

Preferred UI:

    Tile Size *
    [ 2 × 4 ft ▼ ]

Optional:

    Custom Size

When selecting Custom Size:

    Length [ 2 ]
    Width  [ 4 ]
    Unit   Feet

Internally normalize the values.

The display should remain user-friendly.

============================================================ 31. DIMENSION COMPONENT
============================================================

For dimensional categories, use a simple reusable component.

Example:

    Dimensions

    Length [ 8 ] Feet

    Width  [ 4 ] Feet

    Area   32.00 sq.ft.  (Calculated)

Do not ask the user to define Length/Width as custom attributes.

============================================================ 32. FORM SIMPLICITY
============================================================

The user should not have to understand the following concepts while
creating a normal Product Variant:

    Attribute Definition
    Attribute Data Type
    Attribute UOM
    Custom Attribute
    Attribute Relationship
    Category Attribute Mapping

These are configuration concepts belonging to the Super Admin/system.

The normal user should see:

    Size
    Weight
    Colour
    Material
    Dimensions
    etc.

depending on the category.

============================================================ 33. SUPER ADMIN CONFIGURATION
============================================================

This prompt does NOT require redesigning the entire Super Admin
Category Specification Management interface.

However, the implementation must support the architectural assumption
that:

    Super Admin
        ↓
    configures Category Specifications
        ↓
    Product Entry Form
        ↓
    consumes that configuration

If the existing database does not support this relationship, create
the minimum required schema changes.

Do not introduce unnecessary architecture.

============================================================ 34. DATABASE REVIEW
============================================================

Before changing migrations, inspect the current database structure.

Determine how the existing application represents:

    categories
    specifications/attributes
    product variants
    attribute values
    units
    product types

Reuse existing structures wherever possible.

Only add or modify tables when necessary.

Do not create duplicate:

    attributes
    specifications
    category_attributes
    product_attributes

tables if equivalent tables already exist.

============================================================ 35. MIGRATION SAFETY
============================================================

If schema changes are required:

- Create proper new migrations.
- Do not modify already executed migrations unless the project's
  development state explicitly permits it.
- Preserve existing product data.
- Preserve existing variant data.
- Provide data migration where necessary.

Do not destroy existing product specification data simply because the
UI is being simplified.

============================================================ 36. REMOVE OBSOLETE UI
============================================================

Remove the following from Product Variant creation:

    Define Attribute button
    Add Attribute button
    Attribute name entry
    Attribute unit selection
    Attribute type selection
    Free-form custom attribute builder

Replace them with:

    Category-driven Product Details

============================================================ 37. USER EXPERIENCE EXAMPLES
============================================================

EXAMPLE A — TILE

User selects:

    Product Type: Standard
    Category: Tiles
    Brand: Kajaria

Form displays:

    Tile Size *
    [ 2 × 4 ft ▼ ]

User saves.

System stores:

    length = 2
    width = 4
    dimension_unit = FT

Display:

    2 × 4 ft

---

EXAMPLE B — GRANITE

User selects:

    Category: Granite Slab

Form displays:

    Length [ 8 ] Feet
    Width  [ 4 ] Feet

    Area
    32.00 sq.ft.

System stores normalized dimensions.

---

EXAMPLE C — MARBLE

User selects:

    Category: Marble Slab

Form displays:

    Length [ 8 ] Feet
    Width  [4 ] Feet

    Area
    32.00 sq.ft.

---

EXAMPLE D — ADHESIVE

User selects:

    Category: Tile Adhesive

Form displays:

    Net Weight
    [ 20 ] KG

---

EXAMPLE E — SANITARYWARE

User selects:

    Category: Wall Hung WC

Form displays only the specifications configured for that category,
for example:

    Colour
    [ White ▼ ]

    Material
    [ Ceramic ▼ ]

    Installation Type
    [ Wall Hung ▼ ]

No Length/Width fields should appear unless configured for that
category.

============================================================ 38. IMPORTANT PRODUCT FORM PRINCIPLE
============================================================

The form must answer:

    "What information does this product need?"

NOT:

    "What attributes do I want to define?"

The user should never be required to design the data model while
entering a product.

============================================================ 39. TESTING
============================================================

Create/update tests covering:

1. Product Variant can be created without defining custom attributes
   manually.

2. Product Category determines applicable specifications.

3. Required category specifications are enforced.

4. Optional specifications can be omitted.

5. Tile category displays Tile Size.

6. Standard tile size can be selected.

7. Tile size is normalized into length and width.

8. Tile dimensions use the configured unit.

9. Custom tile size can be entered where supported.

10. Granite Slab displays Length and Width.

11. Marble Slab displays Length and Width.

12. Granite/Marble area is calculated correctly.

13. Area cannot be manually overridden.

14. Adhesive displays Weight where configured.

15. Sanitaryware displays only its configured specifications.

16. Changing Category refreshes/reconciles the applicable
    specifications.

17. Incompatible previous category values are not silently retained.

18. Backend validates required specification values.

19. Backend validates numeric dimensional values.

20. Existing Product Variant data remains intact.

============================================================ 40. FINAL UX REQUIREMENT
============================================================

The final Add New Product Variant form must feel like a normal
business application used by a shop employee.

A user should be able to think:

    "I am adding a 2 × 4 ft tile."

not:

    "I need to define Length and Width attributes and assign FT as
     their UOM."

Likewise:

    "I am adding a 20 KG adhesive."

not:

    "I need to create a Weight attribute with KG."

And:

    "I am adding an 8 × 4 ft granite slab."

not:

    "I need to create Length, Width and Area custom attributes."

============================================================ 41. FINAL ARCHITECTURE
============================================================

The final conceptual architecture should be:

                SUPER ADMIN
                     │
                     ▼
             PRODUCT CATEGORY
                     │
                     ▼
        CATEGORY SPECIFICATION CONFIG
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
        Tiles     Adhesive    Sanitaryware
          │          │           │
          ▼          ▼           ▼
       Size       Weight      Product Details
          │          │           │
          └──────────┼───────────┘
                     ▼
             PRODUCT VARIANT
                     │
                     ▼
             NORMALIZED DATA

The Super Admin establishes what information a category needs.

The Organization user only enters the actual product information.

============================================================ 42. DO NOT REINTRODUCE REMOVED CONCEPTS
============================================================

Do NOT reintroduce:

    Product Family

Do NOT reintroduce:

    user-defined custom attributes during Product Variant entry

Do NOT reintroduce:

    a generic workflow engine

Do NOT make the Organization Admin responsible for designing the
product data model.

============================================================ 43. FINAL SUCCESS CRITERIA
============================================================

The implementation is successful only if:

1. The "Specifications / Custom Attributes — Optional" section is gone
   from the normal Product Variant form.

2. There is no "Define Attribute" button in the normal Product Variant
   form.

3. Category determines which Product Details are shown.

4. Tiles use a simple size such as:

    2 × 4 ft

5. Tile dimensions are stored internally as normalized values.

6. Granite and Marble slabs use Length × Width.

7. Slab area is calculated automatically.

8. Adhesive can show Weight.

9. Sanitaryware can show its category-specific characteristics.

10. Required and optional specifications are respected.

11. Units are handled by the category/specification configuration.

12. Ordinary users never need to understand the underlying attribute
    engine.

13. Existing product and variant data is preserved.

14. Backend validation remains authoritative.

15. The implementation reuses the existing project architecture rather
    than introducing a parallel product/specification system.

The final result should be significantly simpler for a layman user
while remaining structurally flexible for future product categories.
