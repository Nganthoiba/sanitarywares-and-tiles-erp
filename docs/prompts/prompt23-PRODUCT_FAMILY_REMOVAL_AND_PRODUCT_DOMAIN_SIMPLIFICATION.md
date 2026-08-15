PROMPT 23 — PRODUCT FAMILY REMOVAL & PRODUCT DOMAIN SIMPLIFICATION

You are the Lead Database Architect, Senior Laravel Architect, Senior React Architect, and ERP Product Domain Architect.

You are working on an EXISTING Laravel + React ERP for:

- Tiles
- Sanitaryware
- Granite
- Marble
- CP Fittings
- Other building materials

The existing Product domain currently contains concepts such as:

- Categories
- Brands
- Product Families
- Product Variants
- Product Variant Attributes
- Product Units
- Unit Conversions
- Product Tax Profiles
- SKU
- GTIN
- Barcode

After reviewing the Product Family / Product Variant relationships and the Add Product Wizard UX, we have decided to REMOVE the Product Family concept from the core domain.

============================================================
IMPORTANT ARCHITECTURAL DECISION
============================================================

REMOVE:

    Product Family

from the Product domain.

The current Product Family concept is optional during product creation and does not provide sufficient business value to justify:

- an additional master entity
- additional foreign-key relationships
- additional UI complexity
- potential Brand inconsistencies
- additional catalog hierarchy
- additional user confusion

The actual business requirement is simpler:

    Category
        +
    Brand
        +
    Product
        +
    Product Specifications
        +
    Units
        +
    Pricing
        +
    Inventory

============================================================
NEW PRODUCT DOMAIN MODEL
============================================================

The target conceptual model is:

                    CATEGORY
                       │
                       │ classification
                       ▼
                    PRODUCT
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
        BRAND     SPECIFICATIONS    UNITS
                       │
                       ▼
                    PRICING
                       │
                       ▼
                   INVENTORY

A Product is the actual catalog item that can be:

- purchased
- received
- stocked
- sold
- priced
- reported
- identified by SKU/GTIN/barcode

============================================================
PRODUCT VARIANT TERMINOLOGY
============================================================

The existing "Product Variant" concept should be evaluated and, unless there is a concrete technical reason to retain the terminology internally, rename the user-facing concept to:

    Product

The user should NOT be required to think:

    Product Family
        ↓
    Product Variant

The user should simply think:

    Product

For example:

    Category:
    Tiles

    Brand:
    Kajaria

    Product:
    Eternity White 600×600 Glossy

This Product is the actual item used by:

    Purchase Orders
    GRN
    Inventory
    Sales
    Reporting

============================================================
CRITICAL BUSINESS RULE — BRAND IS REQUIRED
============================================================

Every Product MUST belong to a Brand.

Brand is NOT optional.

Every Product creation workflow must require:

    Brand *

A Product cannot be created without a valid Brand.

Example:

    Category:
    Tiles

    Brand:
    Kajaria

    Product:
    Eternity White 600×600 Glossy

============================================================
WHY BRAND IS REQUIRED
============================================================

A particular product must have an unambiguous brand identity.

The previous Product Family model allowed a confusing situation such as:

    Product Variant:
        Brand = Kajaria

    Product Family:
        Oasis Collection

    Product Family Brand:
        Vitra

This creates an inconsistent relationship:

    Kajaria
       ↓
    Oasis Collection
       ↓
    Vitra

The new architecture MUST make this impossible by removing Product Family.

The Product has exactly one authoritative Brand relationship.

============================================================
CATEGORY VS BRAND
============================================================

Do not confuse Category and Brand.

Category answers:

    "What type of product is this?"

Examples:

    Tiles
    Sanitaryware
    Granite
    Marble
    CP Fittings
    Accessories

Brand answers:

    "Whose brand is this product?"

Examples:

    Kajaria
    Vitra
    Somany
    Hindware
    Jaquar

Product answers:

    "What exact product are we dealing with?"

Example:

    Kajaria Eternity White 600×600 Glossy Tile

============================================================
PRODUCT EXAMPLE — TILE
============================================================

Category:

    Tiles

Brand:

    Kajaria

Product:

    Eternity White 600×600 Glossy

SKU:

    KAJ-EW-600

GTIN:

    ...

Specifications:

    Size = 600×600 mm
    Color = White
    Finish = Glossy
    Thickness = 8 mm

Units:

    PCS
    BOX

Conversion:

    1 BOX = 4 PCS

This is a complete Product.

There is no Product Family.

============================================================
PRODUCT EXAMPLE — SANITARYWARE
============================================================

Category:

    Sanitaryware

Brand:

    Vitra

Product:

    Oasis Wall Hung WC White

SKU:

    VIT-OASIS-WC-W

Specifications:

    Type = Wall Hung WC
    Color = White
    Material = Ceramic

There is no requirement to create:

    Product Family = Oasis Collection

"Oasis" may remain part of the Product Name or become a Product Attribute/Collection attribute if the existing attribute architecture supports that requirement.

Do NOT automatically create a new Collection entity.

============================================================
PRODUCT EXAMPLE — GRANITE
============================================================

Category:

    Granite

Brand:

    ABC Stone

Product:

    Black Galaxy Granite

Product Type:

    Measured Material

Specifications:

    Color = Black
    Pattern = Galaxy
    Finish = Polished
    Thickness = 18 mm

Inventory Unit:

    SLAB

Pricing Basis:

    SQ.FT.

There is no Product Family.

============================================================
PRODUCT EXAMPLE — MARBLE
============================================================

Category:

    Marble

Brand:

    XYZ Marble

Product:

    Carrara White Marble

Product Type:

    Measured Material

Specifications:

    Color = White
    Finish = Polished
    Thickness = 18 mm

There is no Product Family.

============================================================
PART 1 — FULL CODEBASE AUDIT
============================================================

Before modifying anything, search the entire codebase for all references to:

    ProductFamily
    ProductFamilies
    product_family
    product_family_id
    product_families
    ProductVariant
    ProductVariants
    product_variant
    product_variant_id

Also search for:

    family_id
    family
    variant_id
    variant

Do NOT blindly replace every occurrence of "variant".

Some occurrences may belong to:

- API structures
- inventory
- historical migrations
- unrelated domains
- product attributes
- purchase orders
- sales orders

Each usage must be analyzed.

============================================================
PART 2 — DATABASE AUDIT
============================================================

Inspect all Product-related migrations.

Identify:

1. product_families table
2. product_variants table
3. product_variant_values
4. product_variant_attributes
5. product_units
6. unit_conversions
7. brands
8. categories
9. product_tax_profiles
10. every foreign key pointing to product_variants
11. every foreign key pointing to product_families

Determine whether:

    product_variants

can safely become:

    products

or whether the existing table should remain internally named product_variants while only the user-facing terminology changes.

Do NOT assume that a table rename is automatically required.

============================================================
PART 3 — PRODUCT VARIANT → PRODUCT DECISION
============================================================

Evaluate whether the current Product Variant table/entity is actually the true Product entity.

If it contains the actual:

- SKU
- GTIN
- Barcode
- Brand
- Category
- specifications
- units
- tax profile
- purchasing identity
- sales identity

then it is effectively the Product entity.

In that case, recommend/implement:

    Product Variant → Product

at the domain and UI level.

However, do NOT rename database tables merely for cosmetic reasons.

If renaming creates excessive migration risk, the database table may temporarily remain:

    product_variants

while:

    ProductVariant model/API/UI

is gradually transitioned to:

    Product

Document the chosen approach.

============================================================
PART 4 — BRAND RELATIONSHIP
============================================================

Product must have:

    brand_id NOT NULL

where appropriate to the current schema.

The relationship must be:

    Product
       └── belongsTo Brand

Brand is authoritative.

Do not retain a second Product Family → Brand relationship because Product Family is being removed.

If Product Variant currently contains:

    brand_id

that should become the Product's authoritative brand relationship.

If it does not, add it.

============================================================
PART 5 — CATEGORY RELATIONSHIP
============================================================

Product should retain a relationship to Category if Category is part of the existing business model.

Category should answer:

    "What type of product is this?"

Examples:

    Tiles
    Sanitaryware
    Granite
    Marble
    CP Fittings

Do not use Category as a replacement for Product Family.

Category and Product are different concepts.

============================================================
PART 6 — PRODUCT NAME
============================================================

The Product itself should contain a clear human-readable name.

Example:

    Kajaria Eternity White 600×600 Glossy Tile

or, depending on existing naming conventions:

    Eternity White 600×600 Glossy

Brand should remain a separate field.

Do not duplicate the Brand into the Product Name unless the existing business convention intentionally requires it.

============================================================
PART 7 — PRODUCT FAMILY DATA MIGRATION
============================================================

If Product Family currently exists in production/development data, DO NOT simply delete the table.

Determine what existing family information represents.

For every Product Family:

    Family Name
    Brand
    Category
    Associated Variants

Determine whether the family name is valuable product information.

Possible migration strategies:

A. Incorporate the family name into Product Name.

Example:

    Oasis Collection + White WC

becomes:

    Oasis White Wall Hung WC

OR:

B. Store the family/collection name as a Product Attribute.

Example:

    Collection = Oasis

OR:

C. Discard it if it has no business value.

Do NOT automatically create a new "Collection" table.

Only introduce a new entity if a concrete business requirement requires it.

============================================================
PART 8 — FAMILY INFORMATION MUST NOT BECOME A NEW REQUIRED FIELD
============================================================

Do NOT replace:

    Product Family

with:

    Product Collection

simply to preserve the old database structure.

The purpose of this refactoring is to simplify the domain.

Only introduce a Collection concept in the future if the business demonstrates a need for it.

============================================================
PART 9 — PRODUCT ATTRIBUTES
============================================================

Existing dynamic Product Attribute architecture should remain.

Examples:

Tiles:

    Size
    Color
    Finish
    Thickness
    Material

Granite:

    Color
    Pattern
    Finish
    Thickness
    Grade

Sanitaryware:

    Type
    Color
    Material
    Mounting Type

Do not hard-code family-related fields into Product Attributes.

If the business wants to record:

    Collection = Oasis

that may be an optional Product Attribute.

But do not make Collection mandatory.

============================================================
PART 10 — ADD PRODUCT WIZARD
============================================================

Redesign the Add Product Wizard.

Remove:

    Product Family

completely from the normal product creation workflow.

The wizard should become approximately:

    Step 1 — Basic Information
    Step 2 — Specifications
    Step 3 — Units
    Step 4 — Pricing
    Step 5 — Review

At minimum, the first step should contain:

    Category *
    Brand *
    Product Name *
    SKU
    GTIN
    Barcode

============================================================
PART 11 — CATEGORY FIELD
============================================================

The Add Product Wizard should explain Category.

Label:

    Category *

Helper text:

    "What type of product is this?"

Example:

    Tiles
    Sanitaryware
    Granite
    Marble
    CP Fittings

Category is required if the existing domain rules require every Product to be categorized.

Do not confuse it with Brand.

============================================================
PART 12 — BRAND FIELD
============================================================

Label:

    Brand *

Helper text:

    "The brand associated with this product."

Brand is REQUIRED.

Example:

    [ Kajaria ▼ ]

Do not allow:

    [ No Brand ]

unless the business explicitly introduces an "Unbranded" Brand master record.

Do not use NULL to represent an unbranded product if Brand is a mandatory business concept.

If genuinely unbranded products must be supported in the future, create an explicit controlled concept rather than silently allowing NULL.

============================================================
PART 13 — PRODUCT NAME
============================================================

Label:

    Product Name *

Helper text:

    "The specific product you purchase, stock, and sell."

Example:

    Eternity White 600×600 Glossy

The user is creating a Product, not a Product Variant.

============================================================
PART 14 — REMOVE FAMILY UI
============================================================

Remove all of the following from the normal Product UI:

    Product Family dropdown
    Create Family button
    Family selector
    Family tab
    Family management page
    Family filter
    Family relationship display

unless the feature is being retained temporarily during a migration phase.

Do not leave dead UI elements.

============================================================
PART 15 — PRODUCT LIST
============================================================

The main catalog should be:

    Products

not:

    Product Variants

The table should show:

    Product
    Category
    Brand
    SKU
    Product Type
    Status

Example:

    Eternity White 600×600
    Tiles
    Kajaria
    KAJ-EW-600
    Standard
    Active

============================================================
PART 16 — PRODUCT DETAIL
============================================================

The Product Detail page should show:

    Product Name
    Category
    Brand
    SKU
    GTIN
    Barcode
    Status

Then:

    Specifications
    Units
    Pricing
    Inventory

Do not show:

    Product Family

============================================================
PART 17 — PRODUCT ROUTING
============================================================

Prefer user-facing routes such as:

    /products
    /products/create
    /products/{id}
    /products/{id}/edit

instead of:

    /product-variants

if the current architecture allows this safely.

If existing API endpoints use:

    /product-variants

do not break them blindly.

Provide compatibility or versioned migration where necessary.

============================================================
PART 18 — API
============================================================

Review all Product APIs.

The API payload should conceptually become:

    {
        category_id,
        brand_id,
        name,
        sku,
        gtin,
        barcode,
        product_type,
        ...
    }

It must NOT require:

    product_family_id

New Product creation must reject missing:

    brand_id

if Brand is mandatory.

============================================================
PART 19 — FORM REQUEST VALIDATION
============================================================

Update StoreProductRequest / equivalent validation.

Required:

    category_id
    brand_id
    name

where required by the current business rules.

Validate:

    brand_id exists
    category_id exists
    SKU uniqueness
    GTIN uniqueness where applicable
    organization ownership

Never trust organization_id from the frontend.

============================================================
PART 20 — ORGANIZATION ISOLATION
============================================================

Brand and Category must be organization-scoped according to the existing architecture.

A user must not be able to create:

    Organization A Product
    using Organization B Brand.

The backend must verify that:

    category_id
    brand_id

belong to the authenticated organization or are legitimate global masters according to the existing architecture.

Do not trust client-provided organization_id.

============================================================
PART 21 — PURCHASE DOMAIN IMPACT
============================================================

Review all Purchase-related references to:

    product_variant_id

Purchase Orders should conceptually reference:

    product_id

if the Product Variant → Product refactor is implemented at the domain level.

However, if the database table remains:

    product_variants

temporarily, do not perform a dangerous rename merely for terminology.

The important business rule is:

    Purchase Order → Product

not:

    Purchase Order → Product Family.

============================================================
PART 22 — GRN IMPACT
============================================================

Review GRN.

GRN should reference the actual Product being received.

There must be no dependency on Product Family.

For granite/marble:

    Product
       ↓
    GRN
       ↓
    Actual Slab
       ↓
    Inventory

Product Family must play no role in stock creation.

The existing architecture correctly enforces the principle that inventory creation happens during GRN rather than Purchase Order creation. Preserve that behavior.

============================================================
PART 23 — INVENTORY IMPACT
============================================================

Inventory should identify stock by Product.

For standard products:

    Product
    Quantity
    Unit

For granite/marble:

    Product
    Slab
    Dimensions
    Area
    Location
    Status

Do not introduce Product Family into inventory relationships.

============================================================
PART 24 — SALES IMPACT
============================================================

Review:

    Sales Orders
    Sales Order Items
    Dispatch
    Customer Invoices

They should reference the actual Product.

Remove unnecessary Product Family dependencies.

Do not break existing sales functionality.

============================================================
PART 25 — REPORTING IMPACT
============================================================

Search all reports for:

    product_family_id
    product_family_name
    variant_name
    variant_id

Determine whether family-based reporting exists.

If a report currently groups by Product Family, decide whether it should instead group by:

    Product
    Brand
    Category

Do not silently delete reporting functionality.

Document each affected report.

============================================================
PART 26 — DATABASE TABLE REMOVAL
============================================================

If:

    product_families

is no longer referenced anywhere meaningful, create a migration to remove it.

However, do not drop the table until:

1. all foreign keys are removed,
2. all models are updated,
3. all services are updated,
4. all APIs are updated,
5. all React components are updated,
6. all tests are updated,
7. all existing data has been migrated where necessary.

Use a safe migration sequence.

============================================================
PART 27 — FOREIGN KEY REMOVAL
============================================================

Find all tables containing:

    product_family_id

including but not limited to:

    product_variants
    products
    purchase-related tables
    sales-related tables
    inventory-related tables
    reporting tables

Remove those relationships only after verifying their purpose.

============================================================
PART 28 — PRODUCT VARIANT TABLE
============================================================

Determine whether:

    product_variants

should be renamed to:

    products

or whether the database should retain:

    product_variants

for compatibility.

Prefer the simplest architecture that minimizes unnecessary migration risk.

If the existing Product Variant table is already the actual stockable/sellable product, document:

    ProductVariant (database)
        =
    Product (business/domain concept)

If a full rename is safe, perform it properly.

If not, keep the physical table and simplify the domain/UI terminology.

============================================================
PART 29 — MODEL RELATIONSHIPS
============================================================

Target conceptual Laravel relationships:

    Product
        belongsTo Category
        belongsTo Brand
        hasMany ProductAttributes
        hasMany ProductUnits
        hasMany UnitConversions
        belongsTo ProductTaxProfile
        hasMany PurchaseOrderItems
        hasMany SalesOrderItems
        hasMany InventoryObjects

There should be NO:

    belongsTo ProductFamily

relationship after the migration.

============================================================
PART 30 — BRAND RELATIONSHIP
============================================================

Target:

    Product
       belongsTo Brand

Brand should be required.

Do not duplicate Brand through another parent entity.

This prevents:

    Product Brand = Kajaria
    Parent Brand = Vitra

type inconsistencies.

============================================================
PART 31 — CATEGORY RELATIONSHIP
============================================================

Target:

    Product
       belongsTo Category

Category is classification.

It does not determine Brand.

Example:

    Category = Sanitaryware
    Brand = Vitra
    Product = Oasis Wall Hung WC

This is valid.

============================================================
PART 32 — PRODUCT NAME AND COLLECTION NAMES
============================================================

If a manufacturer uses a collection/series name:

    Oasis Collection

it may be included naturally in the Product Name:

    Oasis Wall Hung WC White

or stored as an optional Product Attribute:

    Collection = Oasis

Do not create a Product Family solely to represent the collection.

============================================================
PART 33 — PRODUCT DUPLICATION
============================================================

If the system supports Duplicate Product:

The duplicated Product must receive its own:

    SKU
    GTIN
    Barcode

It may inherit:

    Category
    Brand
    Product Type
    Attribute definitions
    Unit configuration
    Tax profile

according to existing business rules.

Do not inherit a removed Product Family.

============================================================
PART 34 — PRODUCT SEARCH AND FILTERS
============================================================

Remove:

    Family filter

Use:

    Category
    Brand
    Product Type
    Status

Optional:

    Manufacturer
    Collection/Product Attribute
    Material
    Finish

Do not introduce a new Collection filter unless a real Product Attribute or master concept exists.

============================================================
PART 35 — PRODUCT CATALOG UX
============================================================

The final UX should communicate:

    Category
        "What type is it?"

    Brand
        "Whose brand is it?"

    Product
        "What exact item is it?"

Example:

    Category
    [ Tiles ▼ ]

    Brand
    [ Kajaria ▼ ]

    Product Name
    [ Eternity White 600×600 Glossy ]

This is the complete basic identity.

============================================================
PART 36 — PRODUCT CREATION EXAMPLE
============================================================

The wizard should allow:

    Category:
    Tiles

    Brand:
    Kajaria

    Product Name:
    Eternity White 600×600 Glossy

    SKU:
    KAJ-EW-600

    GTIN:
    ...

No Family selection is required.

============================================================
PART 37 — SANITARYWARE EXAMPLE
============================================================

The wizard should allow:

    Category:
    Sanitaryware

    Brand:
    Vitra

    Product Name:
    Oasis Wall Hung WC White

No:

    Product Family = Oasis Collection

is required.

If the business wants to retain "Oasis" as searchable information, use:

    Collection = Oasis

as an optional Product Attribute if appropriate.

============================================================
PART 38 — GRANITE EXAMPLE
============================================================

The wizard should allow:

    Category:
    Granite

    Brand:
    ABC Stone

    Product:
    Black Galaxy Granite

    Product Type:
    Measured Material

Then configure:

    Inventory Unit:
    SLAB

    Pricing Basis:
    SQ.FT.

No Product Family.

============================================================
PART 39 — DATABASE NORMALIZATION
============================================================

The final model should avoid redundant relationships.

Avoid:

    Product → Brand
    Product → Family
    Family → Brand

when Family no longer exists.

The preferred model is:

    Product → Brand
    Product → Category

This removes an entire source of contradictory data.

============================================================
PART 40 — DO NOT OVER-REFACTOR
============================================================

This task is specifically:

    Product Family Removal
    Product Domain Simplification

Do NOT use this as an opportunity to redesign:

- Inventory
- Accounting
- Sales
- Purchase Orders
- GRN
- Workflow Engine
- Authentication
- RBAC

Only modify those domains where the Product Family / Product Variant relationship directly affects them.

============================================================
PART 41 — TESTING
============================================================

Create/update tests for:

DATABASE:

1. Product requires Brand.
2. Product requires Category where required.
3. Product does not require Product Family.
4. Product can be created without Family.
5. Product belongs to exactly one Brand.
6. Product belongs to the correct organization.
7. Product Family references are removed.
8. No orphaned Product Family references remain.

API:

9. Product creation succeeds with Brand.
10. Product creation fails without Brand.
11. Product creation does not require Family.
12. Product creation rejects cross-organization Brand.
13. Product update preserves Brand integrity.

FRONTEND:

14. Add Product Wizard contains no Family field.
15. Add Product Wizard contains mandatory Brand.
16. Category is clearly explained.
17. Brand is clearly explained.
18. Product Name is clearly explained.
19. Product List shows Brand and Category.
20. Product Detail shows Brand and Category.
21. No Family UI remains.

PURCHASE:

22. Purchase Order can select Product.
23. PO does not require Product Family.
24. GRN can receive Product.
25. Inventory can track Product.

SALES:

26. Sales Order can select Product.
27. Dispatch can process Product.
28. Product remains identifiable throughout the sales lifecycle.

============================================================
PART 42 — DATA MIGRATION VALIDATION
============================================================

Before removing Product Family:

Generate a report showing:

    Product Family
    Brand
    Product Variant
    Product Variant Brand

Identify inconsistent records such as:

    Family Brand != Product Brand

Example:

    Family:
    Oasis Collection
    Family Brand:
    Vitra

    Product:
    Oasis White WC
    Product Brand:
    Kajaria

These records must be resolved before migration.

Possible resolution:

    Preserve Product Brand
    Remove Family relationship
    Optionally preserve Family Name as Product Attribute
    or incorporate it into Product Name

Do NOT silently change Product Brand to match Family Brand.

The existing Product's authoritative Brand must be determined from the business data.

============================================================
PART 43 — BACKWARD COMPATIBILITY
============================================================

If APIs, frontend components, reports, or existing records still use:

    ProductVariant

do not break everything in one step.

Where appropriate:

    ProductVariant
        ↓
    compatibility layer
        ↓
    Product

or:

    database ProductVariant
        =
    domain Product

Document the migration strategy.

============================================================
PART 44 — FINAL DOMAIN MODEL
============================================================

The target Product domain should be:

                    CATEGORY
                       │
                       ▼
                    PRODUCT
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
     BRAND       SPECIFICATIONS       UNITS
                                       │
                                       ▼
                                   CONVERSIONS
                                       │
                                       ▼
                                    PRICING
                                       │
                                       ▼
                                   INVENTORY

There is NO:

    Product Family

in this core model.

============================================================
PART 45 — FINAL USER MENTAL MODEL
============================================================

The user should understand:

    CATEGORY
    "What type of product is this?"

    BRAND
    "Which brand does this product belong to?"

    PRODUCT
    "What exact item are we purchasing, stocking, and selling?"

Example:

    Category:
    Tiles

    Brand:
    Kajaria

    Product:
    Eternity White 600×600 Glossy

This is sufficient to identify the product.

============================================================
PART 46 — FINAL IMPLEMENTATION REQUIREMENT
============================================================

Before writing code, produce a complete impact analysis containing:

1. Existing Product Family tables.
2. Existing Product Variant tables.
3. Existing Product → Brand relationship.
4. Existing Family → Brand relationship.
5. Existing Variant → Family relationship.
6. All Product Family foreign keys.
7. All Product Variant foreign keys.
8. Existing Product UI.
9. Existing Add Product Wizard.
10. Existing Product APIs.
11. Existing Product services.
12. Purchase dependencies.
13. GRN dependencies.
14. Inventory dependencies.
15. Sales dependencies.
16. Reporting dependencies.
17. Data migration requirements.
18. Database migration plan.
19. Model refactoring plan.
20. React refactoring plan.
21. API compatibility plan.
22. Test plan.

Only after reviewing the impact should implementation begin.

============================================================
FINAL OBJECTIVE
============================================================

Remove unnecessary Product Family complexity.

Make Brand mandatory.

Make Product the primary catalog entity.

Make Category a clear classification.

Make Product the actual item used throughout:

    Purchasing
        ↓
    GRN
        ↓
    Inventory
        ↓
    Sales
        ↓
    Reporting

The resulting system should be conceptually simple:

    Category
       +
    Brand
       +
    Product
       +
    Specifications
       +
    Units
       +
    Pricing

No unnecessary Product Family hierarchy.

Do not replace Product Family with another unnecessary hierarchy.

Do not create a new Collection master unless a concrete business requirement proves that it is necessary.

The final implementation must prioritize:

    DATA INTEGRITY
    SIMPLICITY
    AUDITABILITY
    MULTI-TENANT ISOLATION
    MAINTAINABILITY
    USER CLARITY
