You are the Lead ERP Architect, Senior Laravel Developer, Senior React Developer, Database Architect, and UX Designer working on the existing Laravel + React ERP for:

- Tiles
- Sanitaryware
- Granite
- Marble
- CP Fittings
- Accessories
- Other building materials

IMPORTANT:
This is an EXISTING application. Do not redesign unrelated modules.

The objective of this task is to improve the Product Entry / Add New Product Variant, specifically:

    Section 6 — Specifications / Custom Attributes

The system must support:

1. Specifications being completely optional for a Product.
2. Organization-level reusable Attribute Definitions.
3. Product-specific Attribute assignment.
4. Removing an Attribute from a particular Product.
5. Optional Attribute Units.
6. Explicit "NO UNIT" support.
7. Proper measurement-unit handling.
8. Clear distinction between Attribute Units and Product purchasing/inventory/pricing units.
9. Clear user guidance for Length, Width, Thickness, Area, Volume, Weight, etc.
10. A clean and simple UX.

Do NOT reintroduce Product Family.

The current Product model is:

    Category
        +
    Brand *
        +
    Product
        +
    Product Type
        +
    Specifications / Custom Attributes (OPTIONAL)
        +
    Units
        +
    Pricing
        +
    Inventory

Product Type currently supports:

    STANDARD
    MEASURED_MATERIAL

============================================================

1. # IMPORTANT DOMAIN DISTINCTION

There are three different concepts that MUST NOT be confused.

A. ATTRIBUTE DEFINITION

An organization-level reusable definition.

Examples:

    Color
    Finish
    Length
    Width
    Thickness
    Material
    Weight
    Volume

B. PRODUCT ATTRIBUTE VALUE

The value of an attribute for one particular Product.

Examples:

    Product A
        Thickness = 8 MM

    Product B
        Thickness = 10 MM

C. PRODUCT TRANSACTION UOM

The units used to purchase, sell, receive, or stock the Product.

Examples:

    BOX
    PCS
    BAG
    SLAB
    SQ.FT.

These are different concepts.

For example:

    Product:
        Kajaria 600×600 Tile

    Attribute:
        Thickness = 8 MM

    Purchase Unit:
        BOX

This does NOT mean the Product is purchased in MM.

# ============================================================ 2. SPECIFICATIONS / CUSTOM ATTRIBUTES MUST BE OPTIONAL

Section 6 must NOT be mandatory.

The user must be able to create a Product without adding any custom attributes.

Use the heading:

    6. Specifications / Custom Attributes — Optional

Helper text:

    "Add product-specific specifications only when they are relevant to this product."

If no attributes are assigned, display:

    No specifications have been added.

    Add specifications only if this product requires them.

The user must be able to continue and save the Product without adding any attributes.

Do NOT force the user to define:

    Length
    Width
    Thickness
    Color
    Finish
    Material

unless the Product actually requires them.

# ============================================================ 3. SECTION 6 HEADER ACTIONS

Place the following action on the RIGHT side of the Section 6 header:

    [ + Define Attribute ]

The section should visually resemble:

    6. Specifications / Custom Attributes — Optional
                                      [ + Define Attribute ]

The button "Define Attribute" means:

    Create a new reusable Attribute Definition.

It does NOT mean:

    Add a value to the current Product.

# ============================================================ 4. ADD EXISTING ATTRIBUTE

Also provide:

    [ + Add Existing Attribute ]

This means:

    Select an already-defined organization Attribute
    and assign it to this Product.

The distinction must be clear:

    Define Attribute
        = Create a new Attribute Definition

    Add Existing Attribute
        = Assign an existing Attribute to this Product

# ============================================================ 5. ATTRIBUTE DEFINITION

An Attribute Definition should conceptually contain:

    id
    organization_id
    name
    slug
    type
    unit_id nullable

Do NOT introduce another unnecessary table if the existing schema already supports this relationship.

The existing Product Attribute architecture should be reused where possible.

# ============================================================ 6. ATTRIBUTE UNIT MUST BE OPTIONAL

When defining an Attribute, the user must be able to choose:

    NO UNIT

Example:

    Attribute Name:
        Color

    Value Type:
        List

    Unit:
        NO UNIT

This is valid.

Another example:

    Attribute Name:
        Thickness

    Value Type:
        Numeric

    Unit:
        Millimeter (mm)

This is valid.

Do NOT force every Attribute to have a unit.

# ============================================================ 7. NO UNIT IMPLEMENTATION

"NO UNIT" must be a user-facing option.

However, do NOT create a fake physical UOM such as:

    NONE
    NA
    N/A
    UNITLESS

unless the existing architecture explicitly requires it.

Prefer:

    unit_id = NULL

to represent:

    NO UNIT

The UI can display:

    NO UNIT

when `unit_id` is NULL.

The database should treat NULL as:

    No Unit Assigned

# ============================================================ 8. ATTRIBUTE TYPE AND UNIT ARE DIFFERENT

The following are separate properties:

    Attribute Type
    Attribute Unit

For example:

    Color
        Type = List
        Unit = NO UNIT

    Finish
        Type = List
        Unit = NO UNIT

    Thickness
        Type = Numeric
        Unit = MM

    Length
        Type = Numeric
        Unit = MM

    Width
        Type = Numeric
        Unit = MM

    Volume
        Type = Numeric
        Unit = CU.M

Do not combine type and unit into a single field.

# ============================================================ 9. UNIT DIMENSIONS

The UOM system must understand measurement dimensions.

At minimum support the following conceptual dimensions:

    LENGTH
    AREA
    VOLUME
    MASS
    COUNT
    NONE

Examples:

LENGTH:

    MM
    CM
    M
    IN
    FT

AREA:

    SQ.MM
    SQ.M
    SQ.IN
    SQ.FT

VOLUME:

    CU.MM
    CU.CM
    CU.M
    CU.FT

MASS:

    G
    KG
    TON

COUNT:

    PCS
    BOX
    BAG
    SET
    SLAB

NONE:

    No Unit

The implementation must reuse the existing UOM tables if they already exist.

Do NOT create duplicate unit master tables.

# ============================================================ 10. UNIT CONVERSION RULE

Only units belonging to the same measurement dimension are generically convertible.

Valid:

    FT ↔ IN
    FT ↔ MM
    M ↔ MM
    SQ.FT ↔ SQ.M
    KG ↔ G
    CU.M ↔ CU.FT

Invalid:

    FT ↔ KG
    MM ↔ SQ.FT
    PCS ↔ KG
    BOX ↔ FT

Do not allow mathematically meaningless conversions.

# ============================================================ 11. PRODUCT-SPECIFIC CONVERSIONS

Do not confuse generic UOM conversion with Product-specific commercial conversion.

Example:

    1 BOX = 4 PCS

This is NOT a universal UOM rule.

Another Product may have:

    1 BOX = 2 PCS

Therefore:

    BOX → PCS

for a Product is a Product-specific relationship.

Preserve the existing Product Unit / Conversion architecture.

Do not put product-specific conversions into the generic UOM master.

# ============================================================ 12. ATTRIBUTE UNITS ARE NOT TRANSACTION UNITS

This distinction must be reflected throughout the UI.

Example:

    Product:
        Kajaria White Tile

    Specifications:
        Length = 600 MM
        Width = 600 MM
        Thickness = 8 MM

    Purchase Unit:
        BOX

    Stock Unit:
        BOX

The Attribute Units describe the Product's physical characteristics.

The Product Units describe how the Product is purchased, sold, or stocked.

Do not mix these systems.

# ============================================================ 13. ATTRIBUTE UNIT DISPLAY

When displaying units to users, do not show only abbreviations such as:

    MM
    FT
    SQ.FT
    CU.M

Prefer:

    Millimeter (mm)
    Centimeter (cm)
    Meter (m)
    Inch (in)
    Foot (ft)
    Square foot (sq.ft)
    Square meter (sq.m)
    Cubic meter (cu.m)
    Kilogram (kg)

Use the existing UOM names/symbols where available.

# ============================================================ 14. ATTRIBUTE VALUE INPUT

The UI input should depend on Attribute Type.

Examples:

TEXT:

    Material
    [ Ceramic ]

NUMERIC:

    Thickness
    [ 8 ] Millimeter (mm)

LIST:

    Color
    [ White ▼ ]

LIST:

    Finish
    [ Glossy ▼ ]

The unit should be displayed alongside the value where appropriate.

# ============================================================ 15. ATTRIBUTE ASSIGNMENT

A Product should only display Attributes that are assigned to that Product.

Do NOT automatically display every Attribute Definition belonging to the organization.

Example:

Organization has:

    Color
    Finish
    Length
    Width
    Thickness
    Material
    Weight
    Volume
    Grade
    Water Absorption

Product A only needs:

    Color
    Finish
    Thickness

The Product Entry form must display only:

    Color
    Finish
    Thickness

# ============================================================ 16. ADD EXISTING ATTRIBUTE UI

When the user clicks:

    + Add Existing Attribute

show only Attribute Definitions that are NOT already assigned to the Product.

For example:

Already assigned:

    Color
    Finish
    Thickness

Available:

    Length
    Width
    Material
    Weight
    Grade

Do not show duplicate assignment choices.

# ============================================================ 17. REMOVE ATTRIBUTE FROM PRODUCT

Every displayed Product Attribute must have a clear remove action.

Example:

    Thickness    [ 8 ] [ Millimeter (mm) ] [ × ]

The `×` means:

    Remove this Attribute from this Product.

It MUST NOT mean:

    Delete the organization-level Attribute Definition.

This distinction is critical.

# ============================================================ 18. REMOVE ATTRIBUTE BEHAVIOR

If the user removes:

    Thickness

from:

    Product A

only the Product-specific value/assignment must be removed.

The global Attribute Definition:

    Thickness

must remain available to the organization.

Example:

    Attribute Definition:
        Thickness

    Product A:
        Thickness = 8 MM

    Product B:
        Thickness = 10 MM

If Thickness is removed from Product A:

    Product A:
        Thickness removed

    Product B:
        Thickness = 10 MM

    Organization:
        Thickness Attribute Definition still exists

# ============================================================ 19. REMOVE CONFIRMATION

Before removing an Attribute, show a confirmation.

Example:

    Remove "Thickness" from this product?

    This will remove the specification from this product.
    It will not delete the Attribute Definition.

    [Cancel] [Remove]

Do not delete the global Attribute Definition.

# ============================================================ 20. PRODUCT ATTRIBUTE API

If the existing API architecture does not already provide equivalent operations, introduce explicit endpoints.

Conceptually:

    POST /api/products/{productId}/attributes

Purpose:

    Assign an existing Attribute and value to a Product.

Payload:

    {
        "attribute_id": 3,
        "value": "8"
    }

And:

    DELETE /api/products/{productId}/attributes/{attributeId}

Purpose:

    Remove the Attribute assignment from that Product.

The existing endpoint for creating organization-level Attribute Definitions should remain conceptually separate:

    POST /api/product/attributes

Do not confuse:

    Create Attribute Definition

with:

    Assign Attribute to Product.

# ============================================================ 21. ORGANIZATION ISOLATION

All Attribute operations MUST be organization-scoped.

For every operation verify:

    Product.organization_id
        ==
    authenticated user's organization_id

AND:

    Attribute.organization_id
        ==
    authenticated user's organization_id

Do not trust organization_id supplied by React.

A user from Organization A must never be able to:

    assign Organization B's Attribute
    remove Organization B's Attribute
    modify Organization B's Attribute

# ============================================================ 22. NEW PRODUCT CREATION

A new Product does not have a database ID until the Product is created.

Therefore, when defining/assigning Attributes during NEW Product creation:

    Do not attempt to create product_attribute_values
    before the Product exists.

Use an appropriate transaction or staged payload.

The process should be conceptually:

    Create Product
        ↓
    Create/resolve Attribute Definitions
        ↓
    Create Product Attribute Values
        ↓
    Commit transaction

If the transaction fails:

    Roll back the complete operation.

Do not leave partially created Product data.

# ============================================================ 23. EXISTING PRODUCT EDIT

For an existing Product:

    Add Existing Attribute
        ↓
    immediately assign Attribute/value

and:

    Remove Attribute
        ↓
    immediately remove Product-specific assignment

provided this is consistent with the existing application save/edit model.

Do not unnecessarily reload or destroy all Product Attribute values.

# ============================================================ 24. DO NOT DELETE ALL VALUES DURING EVERY UPDATE

Review the existing Product update implementation.

If it currently does:

    DELETE all Product Attribute Values
        ↓
    INSERT all submitted values

refactor this behavior where appropriate.

The implementation should identify:

    Added Attributes
    Changed Attributes
    Removed Attributes
    Unchanged Attributes

and apply only the necessary changes.

However, do not sacrifice transactional integrity merely to optimize queries.

# ============================================================ 25. PRODUCT ENTRY WIZARD

Update the Add New Product Variant.

Section 6 must look conceptually like:

    ┌──────────────────────────────────────────────────────────────┐
    │ 6. Specifications / Custom Attributes — Optional             │
    │                                      [ + Define Attribute ]  │
    │                                                              │
    │ Add product-specific specifications only when relevant.      │
    │                                                              │
    │ Length       [ 600 ] [ Millimeter (mm) ]               [×] │
    │ Width        [ 600 ] [ Millimeter (mm) ]               [×] │
    │ Thickness    [ 8   ] [ Millimeter (mm) ]               [×] │
    │ Color        [ White ] [ No unit ]                     [×] │
    │                                                              │
    │ [ + Add Existing Attribute ]                                 │
    └──────────────────────────────────────────────────────────────┘

If there are no assigned Attributes:

    No specifications have been added.

    Add specifications only if this product requires them.

# ============================================================ 26. DEFINE ATTRIBUTE MODAL

The Define Attribute modal should contain:

    Attribute Name *
    Value Type *
    Unit

Example:

    Attribute Name *
    [ Thickness ]

    Value Type *
    [ Numeric ▼ ]

    Unit
    [ Millimeter (mm) ▼ ]

Actions:

    [Cancel]
    [Define & Add]

For Color:

    Attribute Name:
        Color

    Value Type:
        List

    Unit:
        NO UNIT

# ============================================================ 27. UNIT SELECTION VALIDATION

Do not allow nonsensical combinations.

Examples:

    Color + MM
        INVALID

    Finish + KG
        INVALID

    Thickness + MM
        VALID

    Length + FT
        VALID

    Area + SQ.FT
        VALID

    Volume + CU.M
        VALID

    Weight + KG
        VALID

    Color + NO UNIT
        VALID

    Finish + NO UNIT
        VALID

The exact validation strategy should be consistent with the existing Attribute/UOM architecture.

# ============================================================ 28. ATTRIBUTE DEFINITION VS ATTRIBUTE VALUE

The system must preserve the following model:

    product_attributes
        =
    reusable Attribute Definitions

    product_attribute_values
        =
    Product-specific values

Do not create duplicate Attribute Definitions merely because different Products have different values.

Example:

    ONE Attribute Definition:
        Thickness

    Multiple Product Values:

        Product A → 8 MM
        Product B → 10 MM
        Product C → 12 MM

# ============================================================ 29. EXAMPLE — TILE

Product:

    Kajaria Eternity White 600×600 Glossy

Category:

    Tiles

Brand:

    Kajaria

Product Type:

    STANDARD

Specifications:

    Length = 600 MM
    Width = 600 MM
    Thickness = 8 MM
    Color = White
    Finish = Glossy

Transaction Unit:

    BOX

Product Conversion:

    1 BOX = 4 PCS

Do not confuse:

    600 MM

with:

    BOX

# ============================================================ 30. EXAMPLE — SANITARYWARE

Product:

    Vitra Oasis Wall Hung WC White

Category:

    Sanitaryware

Brand:

    Vitra

Product Type:

    STANDARD

Specifications may be:

    Color = White
    Material = Ceramic

But Length/Width/Thickness do NOT have to be defined if the organization does not need them.

The user may leave Section 6 empty.

# ============================================================ 31. EXAMPLE — GRANITE

Product:

    Black Galaxy Granite

Category:

    Granite

Brand:

    Appropriate Brand

Product Type:

    MEASURED_MATERIAL

Possible specifications:

    Length = 120 IN
    Width = 72 IN
    Thickness = 18 MM
    Finish = Polished
    Color = Black

However, the Product-level dimensions should NOT be confused with the dimensions of every individual slab.

Actual slab measurements must continue to be captured at GRN/inventory where required by the existing architecture.

# ============================================================ 32. EXAMPLE — MARBLE

Product:

    Carrara White Marble

Category:

    Marble

Brand:

    Appropriate Brand

Product Type:

    MEASURED_MATERIAL

Possible specifications:

    Thickness = 18 MM
    Finish = Polished
    Color = White

Length and Width may be omitted if the Product itself does not have fixed dimensions.

Individual slab measurements can be captured during receiving.

# ============================================================ 33. NO SPECIFICATION PRODUCT

The system must support:

    Product:
        Cleaning Accessory

    Category:
        Accessories

    Brand:
        XYZ

    Product Type:
        STANDARD

    Specifications:
        None

This must be a valid Product.

Do not force meaningless attributes simply to populate Section 6.

# ============================================================ 34. PRODUCT DETAIL DISPLAY

Product Detail should display only assigned Attributes.

Example:

    Specifications

    Color:
        White

    Finish:
        Glossy

    Thickness:
        8 MM

Do not display unused organization-wide Attribute Definitions.

# ============================================================ 35. PRODUCT LIST

Do not add all custom Attributes as columns to the main Product List.

The Product List should remain concise.

Use:

    Product
    Category
    Brand
    Product Type
    SKU
    Status

Specifications belong on:

    Product Detail
    Product Edit

unless future reporting requirements justify dedicated filters.

# ============================================================ 36. REMOVE FAMILY CONCEPT

Do NOT reintroduce:

    Product Family
    Product Variant Family
    Collection Master

as part of this implementation.

The Product itself is the primary catalog entity.

# ============================================================ 37. DO NOT CONFUSE COLLECTION WITH ATTRIBUTE

If the organization wants to record:

    Collection = Oasis

this may be represented as an optional Product Attribute if appropriate.

Do NOT create:

    Product Family
    Collection Master

merely to preserve the old Product Family concept.

# ============================================================ 38. DATABASE CHANGES

Before creating migrations, inspect the current schema.

If `product_attributes` does not currently have a unit relationship, add:

    unit_id nullable

with an appropriate foreign key to the EXISTING UOM master.

Do not create a duplicate UOM table.

If the existing schema already has an appropriate unit relationship, reuse it.

Ensure:

    NULL unit_id = NO UNIT

# ============================================================ 39. DATABASE CONSTRAINTS

Maintain uniqueness of:

    organization_id
    product_id
    product_attribute_id

for Product-specific Attribute values.

This prevents duplicate assignment of the same Attribute to the same Product.

Do not allow:

    Product A
        Thickness = 8
        Thickness = 10

as two simultaneous values unless the existing domain explicitly supports multi-valued Attributes.

# ============================================================ 40. API VALIDATION

Validate:

    product exists
    product belongs to current organization
    attribute exists
    attribute belongs to current organization
    value matches Attribute type
    unit is valid for the Attribute configuration

Do not trust frontend validation.

Server-side validation is authoritative.

# ============================================================ 41. REACT IMPLEMENTATION

Update the existing Product Entry component.

Do not rewrite the entire Product Entry Wizard unless necessary.

Refactor only the relevant Attribute section and supporting state/API logic.

Use clear state separation such as:

    assignedAttributes
    availableAttributes

Do not continue treating every organization Attribute as an automatically assigned Product Attribute.

# ============================================================ 42. ERROR HANDLING

Handle:

    duplicate Attribute assignment
    invalid Attribute ID
    cross-organization Attribute
    invalid unit
    invalid value
    removing non-existent assignment
    network failure
    failed Product creation
    failed Attribute assignment

Display user-friendly messages.

Do not expose SQL/database errors directly to users.

# ============================================================ 43. AUDITABILITY

If the existing ERP has an audit/event mechanism, Attribute assignment and removal should participate appropriately.

Important events may include:

    Product Attribute Added
    Product Attribute Updated
    Product Attribute Removed

Do not create a new audit system solely for this task if an existing mechanism already exists.

# ============================================================ 44. TESTING

Create/update automated tests for:

DATABASE:

1. Attribute Definition can exist without a Unit.
2. Attribute Definition can have a Unit.
3. Product can exist without any Attributes.
4. Product can have one Attribute.
5. Product can have multiple Attributes.
6. Same Attribute can be assigned to multiple Products.
7. Same Attribute cannot be assigned twice to one Product.
8. Removing Product A's Attribute does not affect Product B.
9. Removing Product Attribute does not delete Attribute Definition.
10. Cross-organization assignment is rejected.

UNIT:

11. MM belongs to LENGTH.
12. FT belongs to LENGTH.
13. SQ.FT belongs to AREA.
14. CU.M belongs to VOLUME.
15. KG belongs to MASS.
16. Invalid dimension combinations are rejected where applicable.

API:

17. Define Attribute works.
18. Add Existing Attribute works.
19. Remove Attribute works.
20. Missing Attribute is rejected.
21. Invalid value type is rejected.
22. Invalid unit is rejected.
23. Cross-organization access is rejected.

FRONTEND:

24. Section 6 is optional.
25. Product can be saved with no Attributes.
26. Only assigned Attributes are displayed.
27. Define Attribute button appears on the right side of Section 6.
28. Add Existing Attribute is available.
29. Already assigned Attributes are excluded from Add Existing Attribute.
30. Remove button is displayed for assigned Attributes.
31. Remove confirmation is displayed.
32. Removing an Attribute removes it only from the current Product.
33. Define Attribute does not delete existing Attributes.
34. Unit names are displayed clearly.
35. NO UNIT is displayed correctly.

PRODUCT EXAMPLES:

36. Tile with Length/Width/Thickness works.
37. Sanitaryware with only Color/Material works.
38. Granite with physical specifications works.
39. Product with no specifications works.

# ============================================================ 45. MIGRATION SAFETY

Before changing the database:

1. Inspect existing migrations.
2. Inspect existing models.
3. Inspect existing Product APIs.
4. Inspect ProductEntry.jsx.
5. Inspect Product Attribute controllers/services.
6. Inspect UOM models/tables.
7. Inspect all references to product_attribute_id.
8. Inspect all references to unit_id.
9. Inspect existing data.

Do not assume the schema from this prompt is identical to the current database.

Use the existing implementation as the source of truth.

# ============================================================ 46. DO NOT BREAK EXISTING PRODUCT BEHAVIOR

Preserve:

    Product creation
    Product editing
    Brand
    Category
    SKU
    GTIN
    Product Type
    Units
    Pricing
    Tax Profile
    Inventory integration

Only modify the Attribute/Specification behavior required by this prompt.

# ============================================================ 47. FINAL UX OBJECTIVE

The user should understand Section 6 immediately:

    Specifications / Custom Attributes — Optional

    "Add product-specific specifications only when
     they are relevant to this product."

The user can:

    [ + Define Attribute ]

or:

    [ + Add Existing Attribute ]

The user can assign:

    Length = 600 MM
    Width = 600 MM
    Thickness = 8 MM

or:

    Color = White
    Finish = Glossy

or nothing at all.

Every displayed Attribute can be removed:

    Thickness   8 MM   [×]

Removing it affects only that Product.

The global Attribute Definition remains available.

# ============================================================ 48. IMPLEMENTATION ORDER

Implement in this order:

PHASE 1:
Audit current Product Attribute and UOM schema.

PHASE 2:
Modify database only if necessary for nullable unit_id.

PHASE 3:
Update Laravel Models.

PHASE 4:
Update validation and API endpoints.

PHASE 5:
Refactor Product Attribute assignment/removal logic.

PHASE 6:
Refactor React Product Entry state.

PHASE 7:
Redesign Section 6.

PHASE 8:
Add Define Attribute / Add Existing Attribute / Remove Attribute behavior.

PHASE 9:
Add confirmation and error handling.

PHASE 10:
Update Product Detail display.

PHASE 11:
Run automated tests.

PHASE 12:
Manually verify:

        Tile
        Sanitaryware
        Granite
        Marble
        Product without specifications

============================================================
FINAL ARCHITECTURAL PRINCIPLE
============================================================

Keep the Product Specification system simple:

    Attribute Definition
        ↓
    Product-specific Attribute Value

An Attribute may have:

    Unit
        OR
    NO UNIT

A Product may have:

    Zero
    One
    Many

Specifications.

The user can:

    Define
    Assign
    Edit
    Remove

Product-specific Attributes.

Never confuse:

    Attribute Unit

with:

    Purchase Unit
    Stock Unit
    Sales Unit
    Pricing Unit

For example:

    Thickness = 8 MM

is a Product Specification.

    Purchase Unit = BOX

is a Transaction UOM.

    Price = ₹800 / BOX

is a Pricing UOM.

For granite:

    Slab dimensions = captured at GRN

while:

    Price = ₹180 / SQ.FT.

These concepts must remain separate.

The final implementation must prioritize:

    SIMPLICITY
    USER CLARITY
    DATA INTEGRITY
    MULTI-TENANT ISOLATION
    REUSABILITY
    CORRECT UNIT SEMANTICS
    MAINTAINABILITY
