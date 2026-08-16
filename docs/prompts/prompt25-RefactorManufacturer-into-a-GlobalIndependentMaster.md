You are working on the existing Laravel + React ERP system for:

- Tiles
- Sanitaryware
- Granite
- Marble
- CP Fittings
- Accessories
- Other building materials

This is an EXISTING application.

IMPORTANT:
Study the current project code, migrations, models, controllers, services, React components, routes, organization-scoping mechanism, and Product relationships before making changes.

Do not redesign unrelated modules.

============================================================
OBJECTIVE
============================================================

Refactor the Manufacturer concept so that a Manufacturer is a:

    GLOBAL
    INDEPENDENT
    REAL-WORLD BUSINESS ENTITY

A Manufacturer does NOT belong to an Organization.

The current implementation incorrectly treats Manufacturer as organization-owned because:

    manufacturers.organization_id

exists and the Manufacturer model uses the organization-scoping mechanism.

This must be changed.

============================================================

1. # FINAL ARCHITECTURAL DECISION

Manufacturer is independent of the ERP Organization.

Therefore:

    manufacturers
        MUST NOT contain organization_id.

Do NOT create:

    organization_manufacturers

Do NOT create any organization-to-manufacturer ownership/relationship table merely to indicate that an organization uses a manufacturer.

The relationship between an Organization and a Manufacturer is already represented through the organization's Products.

Example:

    Organization A
        Product A
            manufacturer_id = 10

    Organization B
        Product B
            manufacturer_id = 10

Both Products refer to:

    Manufacturer #10

which represents the same real-world manufacturer.

# ============================================================ 2. CURRENT MODEL

The current Manufacturer implementation contains organization-specific behavior.

The current database concept is approximately:

    manufacturers
    -------------------------
    id
    organization_id
    name
    address
    phone
    email
    website
    is_active
    timestamps
    softDeletes

The current Manufacturer model also uses the organization-scoping mechanism.

The current API creates Manufacturer records using:

    authenticated_user.organization_id

This behavior must be removed.

Do not merely stop passing organization_id from the controller.

The entire Manufacturer model must stop being organization-scoped.

# ============================================================ 3. NEW MANUFACTURER MODEL

Refactor Manufacturer into a global master.

The Manufacturer table should conceptually contain:

    id
    legal_name
    trade_name
    gstin
    registration_number
    business_constitution
    address
    phone
    email
    website
    is_active
    verification_status
    verified_at
    timestamps
    softDeletes

Before changing the migration, inspect the CURRENT migration and existing data.

Do not blindly replace existing fields.

Preserve useful existing information where appropriate.

# ============================================================ 4. LEGAL NAME

Add/use:

    legal_name

Meaning:

    The official legal name of the manufacturer.

Example:

    Kajaria Ceramics Limited

This should represent the legal business identity rather than merely a product/brand name.

# ============================================================ 5. TRADE NAME

Add:

    trade_name

This may be different from the legal name.

Example:

    Legal Name:
        Kajaria Ceramics Limited

    Trade Name:
        Kajaria

Do not assume:

    legal_name == trade_name

# ============================================================ 6. GSTIN

Add/use:

    gstin

GSTIN should be nullable.

Do not make GSTIN mandatory because not every real-world manufacturer necessarily has the same tax-registration circumstances.

GSTIN should be treated as an important business identity/duplicate-detection field.

Normalize GSTIN before storing and comparing it.

For example:

    lowercase/uppercase normalization
    trimming whitespace
    removing accidental spaces where appropriate

Do not store multiple representations of the same GSTIN.

If a global unique constraint is appropriate based on the existing application/business rules, use it.

If the existing data prevents immediate unique enforcement, first provide a safe data-cleaning/migration strategy.

# ============================================================ 7. REGISTRATION NUMBER

Add/use:

    registration_number

This may represent the relevant corporate/business registration identifier.

It should be nullable.

Do not assume every Manufacturer will have a CIN.

The field should remain generic enough for applicable business registration identifiers.

# ============================================================ 8. BUSINESS CONSTITUTION

Add:

    business_constitution

Examples:

    PRIVATE_LIMITED
    PUBLIC_LIMITED
    LLP
    PARTNERSHIP
    PROPRIETORSHIP
    GOVERNMENT
    OTHER

Use an enum/value convention only if it is consistent with the existing project architecture.

Do not over-engineer this into another master table unless the current project already uses one.

# ============================================================ 9. EXISTING CONTACT INFORMATION

Preserve the useful existing Manufacturer fields:

    address
    phone
    email
    website
    is_active

Do not unnecessarily remove existing data.

If the current address is a single field, keep it simple for now unless the existing project already has a reusable address architecture.

Do not introduce a complex contact/address subsystem as part of this task.

# ============================================================ 10. VERIFICATION STATUS

Add/use:

    verification_status

Suggested values:

    UNVERIFIED
    VERIFIED
    REJECTED

The purpose is to distinguish:

    information entered by a user

from:

    information verified by an authoritative source or administrator.

Do NOT implement external GST/MCA API integration in this task unless such integration already exists in the current project.

For now, implement the data structure and UI concept only.

# ============================================================ 11. VERIFIED AT

Add:

    verified_at nullable

This records when the Manufacturer's identity information was verified.

Do not automatically populate this merely because a user creates a Manufacturer.

Only populate it when the application's verification mechanism actually verifies the record.

# ============================================================ 12. NO ORGANIZATION_ID

Remove:

    manufacturers.organization_id

from the Manufacturer schema.

Do NOT replace it with:

    organization_manufacturers

Do NOT create another tenant relationship table.

Manufacturer is global.

# ============================================================ 13. REMOVE ORGANIZATION GLOBAL SCOPE

The Manufacturer model must NOT use:

    BelongsToOrganization

or:

    OrganizationScope

or any equivalent tenant-scoping mechanism.

This is critical.

The current organization scope is appropriate for tenant-owned data such as:

    Products
    Purchase Orders
    GRNs
    Inventory
    Pricing
    Accounting records

but it is NOT appropriate for the global Manufacturer master.

# ============================================================ 14. MANUFACTURER IDENTITY

The primary identity of a Manufacturer is NOT:

    organization_id + name

because organization_id no longer exists.

The system must instead identify potential duplicate Manufacturers using appropriate real-world business identifiers.

Preferred matching order:

    1. GSTIN
    2. Registration Number where sufficiently identifiable
    3. Normalized Legal Name
    4. Trade Name
    5. Supporting information such as address/phone

Do NOT automatically conclude that two records are identical based solely on name.

For example:

    ABC Industries Pvt Ltd

and:

    ABC Industries Private Limited

may or may not be the same entity.

The system should warn about possible duplicates rather than blindly merging them.

# ============================================================ 15. DUPLICATE DETECTION

Before creating a new Manufacturer, search the global Manufacturer master.

Example:

User enters:

    Manufacturer:
        Kajaria

    GSTIN:
        18XXXXXXXXXX1Z5

The system should first search for an existing matching Manufacturer.

If found, display:

    Existing Manufacturer Found

    Kajaria Ceramics Limited
    Trade Name: Kajaria
    GSTIN: 18XXXXXXXXXX1Z5

    [Use Existing Manufacturer]
    [Cancel]

Do NOT create another Manufacturer automatically.

# ============================================================ 16. POSSIBLE DUPLICATE WARNING

If GSTIN is not supplied but the name closely matches an existing Manufacturer, display:

    Possible Existing Manufacturer

    Kajaria Ceramics Limited
    Kajaria

    This manufacturer may already exist in the system.

    [Use Existing]
    [Continue Anyway]

Do not silently merge records.

Only a strong unique identifier such as GSTIN should be treated as an automatic duplicate criterion where appropriate.

# ============================================================ 17. WHO CAN ADD A MANUFACTURER?

For the CURRENT application:

    Organization Admin

may add a Manufacturer to the global Manufacturer master.

This does NOT mean:

    the Manufacturer belongs to the Organization.

It means:

    the Organization Admin is contributing a new
    real-world Manufacturer record to the global master.

This is an interim governance model appropriate for the current application.

Do not introduce a separate Platform Administrator solely for this task.

# ============================================================ 18. IMPORTANT GLOBAL DATA GOVERNANCE

Because Manufacturer is global, a record created by Organization A may subsequently be used by:

    Organization B
    Organization C
    Organization D

Therefore, an Organization Admin must NOT be allowed to arbitrarily overwrite canonical Manufacturer identity information after the record has become shared.

At minimum:

    creation
        = allowed

    arbitrary global modification
        = must be restricted/controlled

If the current application does not yet have platform-level administration, implement a conservative approach.

For example:

    Organization Admin may create a Manufacturer.

    Organization Admin may edit only permitted fields
    or edit records they have permission to modify.

Do not introduce an elaborate approval workflow unless necessary.

Document the limitation clearly.

# ============================================================ 19. MANUFACTURER CREATE UI

Replace the current organization-oriented terminology such as:

    Register New Manufacturer

with terminology closer to:

    Add Manufacturer

or:

    Add Manufacturer to Master

The UI should make it clear that this is a shared Manufacturer master.

Suggested form:

    Add Manufacturer

    Legal Name *
    [........................................]

    Trade Name
    [........................................]

    GSTIN
    [........................................]

    Registration Number
    [........................................]

    Business Constitution
    [ Select ]

    Address
    [........................................]

    Phone
    [........................................]

    Email
    [........................................]

    Website
    [........................................]

    [Cancel] [Save Manufacturer]

Do not force all fields to be mandatory.

# ============================================================ 20. BETTER SEARCH-FIRST UX

Before showing the complete creation form, prefer a search-first experience.

Example:

    Add Manufacturer

    Search existing Manufacturer
    [ Kajaria............................ ]

    GSTIN
    [ 18XXXXXXXXXX1Z5 .................. ]

    [ Search ]

If an existing Manufacturer is found:

    Existing Manufacturer Found

    [Manufacturer details]

    [Use Existing]

If no match is found:

    No matching Manufacturer found.

    [Create New Manufacturer]

This reduces duplicate creation.

# ============================================================ 21. MANUFACTURER LIST

The Manufacturer Registry should become a GLOBAL registry.

Do not filter it automatically by:

    current organization_id

because Manufacturer no longer has organization_id.

The list may show:

    Legal Name
    Trade Name
    GSTIN
    Registration Number
    Status
    Verification Status

Do not display organization ownership because there is none.

# ============================================================ 22. MANUFACTURER SEARCH

Manufacturer search should work globally.

Search by:

    legal_name
    trade_name
    GSTIN
    registration_number

Use appropriate indexing.

Do not search only within the current organization.

# ============================================================ 23. PRODUCT RELATIONSHIP

The existing Product model/table currently contains:

    manufacturer_id

Keep this relationship.

The meaning becomes:

    Product.organization_id
        =
    the organization that owns the Product record

while:

    Product.manufacturer_id
        =
    the independent Manufacturer that made the Product

Example:

    Organization A
        Product A
            manufacturer_id = 10

    Organization B
        Product B
            manufacturer_id = 10

Both refer to:

    Manufacturer #10
    Kajaria Ceramics Limited

This is the intended architecture.

# ============================================================ 24. PRODUCT CREATION VALIDATION

When an Organization creates a Product and selects a Manufacturer:

    manufacturer_id

must reference a valid global Manufacturer.

Do NOT check:

    manufacturer.organization_id == current organization

because Manufacturer no longer has organization_id.

Do check:

    Manufacturer exists
    Manufacturer is active
    Manufacturer is not soft-deleted

where appropriate.

# ============================================================ 25. PRODUCT ENTRY UI

Review the current Product Entry / Add Product Wizard.

The Manufacturer field should load from the global Manufacturer master.

The user should be able to:

    Search Manufacturer
    Select Manufacturer
    Add a new Manufacturer if permitted

Do not show only Manufacturers created by the current Organization.

# ============================================================ 26. MANUFACTURER MODEL

Update:

    app/.../Manufacturer.php

according to the actual project structure.

Remove:

    BelongsToOrganization

Remove:

    organization_id from fillable

Remove:

    organization-scoped query behavior

Remove any automatic assignment of:

    organization_id

Add appropriate:

    fillable
    casts
    relationships

Do not change unrelated model behavior.

# ============================================================ 27. API CONTROLLERS

Review the current Manufacturer API controller.

Remove logic such as:

    $orgId = $request->user()->organization_id;

    'organization_id' => $orgId

Manufacturer creation must no longer assign organization_id.

Remove organization-specific filtering such as:

    where('organization_id', $orgId)

from Manufacturer queries.

Manufacturer search/list endpoints must operate against the global Manufacturer master.

# ============================================================ 28. AUTHORIZATION

Do not remove authentication/authorization.

Organization Admin must still be authenticated.

Use the existing permission/RBAC mechanism.

The permission should mean:

    permission to manage Manufacturer master

not:

    ownership of Manufacturer.

Do not bypass the existing authorization system.

# ============================================================ 29. MULTI-TENANT SECURITY

This is a special case.

Most ERP data is organization-scoped.

Manufacturer is GLOBAL.

Therefore, explicitly document this exception.

A global Manufacturer can be referenced by Products belonging to different organizations.

However:

    Organization A

must not be able to access or modify organization-specific data belonging to:

    Organization B

merely because both use the same Manufacturer.

Manufacturer being global does NOT make:

    Products
    Inventory
    Purchase Orders
    Pricing
    GRNs

global.

# ============================================================ 30. MANUFACTURER DELETE

Do NOT physically delete a Manufacturer that is referenced by Products.

Use:

    soft delete

or:

    deactivate

according to the existing project architecture.

Before deleting/deactivating, check whether the Manufacturer is referenced by Products.

If referenced, do not break the foreign key.

Prefer:

    is_active = false

or soft delete.

# ============================================================ 31. EXISTING DATA MIGRATION

This is a critical part of the implementation.

The current database may contain:

    manufacturers.organization_id

and potentially duplicate Manufacturer records across organizations.

Do NOT simply drop organization_id.

First analyze existing data.

Example:

    Organization A
        Kajaria
        GSTIN = X

    Organization B
        Kajaria
        GSTIN = X

These should be candidates for consolidation into:

    Manufacturer #10
        Kajaria
        GSTIN = X

and all Product records must point to:

    manufacturer_id = 10

before duplicate Manufacturer records are removed.

# ============================================================ 32. DATA MIGRATION STRATEGY

Create a safe migration/data migration process:

Step 1:
Identify existing Manufacturer records.

Step 2:
Normalize identity fields.

Step 3:
Group likely duplicates.

Step 4:
Automatically merge only records with strong identity evidence,
especially matching GSTIN.

Step 5:
Re-point Product manufacturer_id references.

Step 6:
Preserve the best available Manufacturer information.

Step 7:
Handle unresolved duplicates conservatively.

Step 8:
Remove organization_id only after references are safe.

Step 9:
Add appropriate indexes/constraints.

Do NOT silently merge records based solely on name.

# ============================================================ 33. DUPLICATE MERGE SAFETY

When two Manufacturer records appear to be duplicates:

    Same GSTIN
        → strong duplicate candidate

    Same registration number
        → strong candidate depending on context

    Same name only
        → possible duplicate, NOT automatic merge

If records conflict:

    Record A:
        GSTIN = X

    Record B:
        GSTIN = Y

even if names are identical:

    do NOT automatically merge.

# ============================================================ 34. DATABASE INDEXING

Review indexes for:

    gstin
    legal_name
    trade_name
    registration_number

Use unique constraints only where they accurately represent real-world identity.

For example:

    GSTIN

may be globally unique where applicable.

Do not make:

    legal_name

globally unique merely because duplicate legal names are uncommon.

# ============================================================ 35. MANUFACTURER AND BRAND

Do not automatically merge:

    Manufacturer

with:

    Brand.

They are separate concepts.

A Manufacturer may own/manufacture multiple Brands.

Do not introduce a Manufacturer → Brand relationship unless the existing application/business rules explicitly require it.

Do not reintroduce Product Family.

# ============================================================ 36. MANUFACTURER VS SUPPLIER

Do NOT modify the current Supplier architecture as part of this task.

The Supplier remains organization-scoped for now.

Do NOT:

    globalize Supplier
    remove supplier.organization_id
    create global suppliers
    create organization_suppliers

That is explicitly OUT OF SCOPE for this task.

This task is ONLY about Manufacturer.

# ============================================================ 37. PURCHASE DOMAIN

Do not modify:

    Purchase Orders
    GRNs
    Supplier Invoices
    Purchase Returns

merely because Manufacturer is being globalized.

These modules use Supplier, not Manufacturer, as their primary purchasing party.

Only update Product → Manufacturer references where necessary.

# ============================================================ 38. PRODUCT MANUFACTURER SELECTOR

Update the Product Entry Manufacturer selector.

Current behavior may assume Manufacturer is organization-scoped.

Change it so that:

    all active global Manufacturers

are available to the authenticated organization.

The Product itself remains organization-scoped.

# ============================================================ 39. API RESPONSE

Manufacturer API responses should no longer expose:

    organization_id

as an ownership field because it no longer exists.

Return appropriate fields such as:

    id
    legal_name
    trade_name
    gstin
    registration_number
    business_constitution
    address
    phone
    email
    website
    is_active
    verification_status

Do not expose unnecessary internal information.

# ============================================================ 40. BACKWARD COMPATIBILITY

Before implementation, search the entire codebase for:

    organization_id
    Manufacturer::class
    Manufacturer
    manufacturer_id
    manufacturers
    BelongsToOrganization
    OrganizationScope

Identify every affected location.

Do not assume the Manufacturer model is only used by Product Entry.

Update all affected references.

# ============================================================ 41. TESTING

Create/update automated tests for:

DATABASE:

1. Manufacturer can exist without organization_id.
2. Manufacturer is globally unique where strong identifiers permit it.
3. Duplicate GSTIN is detected/rejected appropriately.
4. Manufacturer may have a nullable GSTIN.
5. Manufacturer may have a nullable registration_number.
6. Manufacturer supports legal_name and trade_name.
7. Manufacturer supports verification_status.
8. Manufacturer can be soft-deleted/deactivated safely.

MODEL:

9. Manufacturer does not use organization scope.
10. Manufacturer does not automatically receive organization_id.
11. Manufacturer can be queried globally.
12. Manufacturer can be referenced by Products from multiple organizations.

PRODUCT:

13. Organization A can create a Product referencing Manufacturer X.
14. Organization B can create a Product referencing the same Manufacturer X.
15. Organization A cannot access Organization B's Product.
16. Manufacturer remains shared.

API:

17. Organization Admin can search global Manufacturers.
18. Organization Admin can select an existing Manufacturer.
19. Organization Admin can create a new Manufacturer if permitted.
20. Duplicate GSTIN is detected.
21. Possible name duplicates generate warnings.
22. Invalid Manufacturer ID is rejected.
23. Inactive Manufacturer cannot be selected if business rules prohibit it.
24. Cross-organization Product creation with a global Manufacturer works.

SECURITY:

25. Manufacturer being global does not bypass Product tenant isolation.
26. Organization A cannot modify Organization B's Products.
27. Manufacturer management still requires proper permission.

UI:

28. Manufacturer search is global.
29. Existing Manufacturer is suggested before creating a duplicate.
30. Add Manufacturer form does not contain organization_id.
31. Product Entry can select global Manufacturers.
32. Manufacturer Registry does not filter by current organization.
33. Supplier behavior remains unchanged.

# ============================================================ 42. MANUAL VERIFICATION

After implementation, manually test:

Scenario 1:

    Organization A creates:

        Kajaria Ceramics Limited
        GSTIN X

Scenario 2:

    Organization B searches:

        Kajaria

Expected:

    Organization B finds the SAME Manufacturer.

It must NOT create another Manufacturer automatically.

Scenario 3:

    Organization A creates:

        Product A
        Manufacturer = Kajaria

Scenario 4:

    Organization B creates:

        Product B
        Manufacturer = Kajaria

Expected:

    Product A.manufacturer_id
        ==
    Product B.manufacturer_id

while:

    Product A.organization_id
        !=
    Product B.organization_id

Scenario 5:

    Organization A edits Product A.

Expected:

    Organization B's Product B remains inaccessible.

Scenario 6:

    Organization A attempts to create another Manufacturer
    with the same GSTIN.

Expected:

    duplicate warning/rejection.

# ============================================================ 43. DO NOT IMPLEMENT EXTERNAL VERIFICATION YET

Do NOT integrate:

    GST API
    MCA API
    external business verification API

unless the current project already contains such integration.

For this implementation, prepare the schema and architecture so that verification can be added later.

Use:

    verification_status
    verified_at

where appropriate.

# ============================================================ 44. UI TERMINOLOGY

Avoid wording such as:

    My Manufacturers
    Organization Manufacturers
    Manufacturer belonging to Organization

Use:

    Manufacturers
    Manufacturer Master
    Add Manufacturer
    Select Manufacturer

When appropriate, explain:

    "Manufacturers are shared master records representing
     independent real-world businesses."

Do not expose technical terminology such as:

    Global Master Entity

to ordinary users unless necessary.

# ============================================================ 45. FINAL DATA MODEL

The final architecture should be:

    manufacturers
    ─────────────────────────────
    id
    legal_name
    trade_name
    gstin
    registration_number
    business_constitution
    address
    phone
    email
    website
    verification_status
    verified_at
    is_active
    timestamps
    softDeletes
    created_by: id reference to users table
    updated_by: id reference to users table


    product_variants
    ─────────────────────────────
    id
    organization_id
    brand_id
    manufacturer_id
    ...

There must NOT be:

    manufacturers.organization_id

and there must NOT be:

    organization_manufacturers

# ============================================================ 46. FINAL RELATIONSHIP MODEL

The intended relationship is:

    Manufacturer
         ▲
         │
         │ manufacturer_id
         │
      Product
         │
         │ organization_id
         ▼
    Organization

Meaning:

    Manufacturer
        =
    independent real-world entity

    Product
        =
    organization-owned catalog record

    Organization
        =
    owner of Product

This is the final architecture.

# ============================================================ 47. IMPORTANT SCOPE LIMIT

Do not make the following changes in this task:

    Supplier globalization
    Supplier relationship redesign
    Brand globalization
    Product Family
    Product Variant redesign
    Purchase Requisition
    Purchase Order redesign
    GRN redesign
    Inventory redesign
    Authentication redesign

Only implement the Manufacturer globalization and all changes required to keep the existing Product functionality working correctly.

# ============================================================ 48. IMPLEMENTATION ORDER

Follow this order:

PHASE 1:
Audit current Manufacturer schema/model/controller/UI
and all manufacturer_id references.

PHASE 2:
Audit existing Manufacturer data and identify duplicates.

PHASE 3:
Design the data migration strategy.

PHASE 4:
Update Manufacturer migration/schema.

PHASE 5:
Update Manufacturer model and remove organization scoping.

PHASE 6:
Update Manufacturer API/controller/service logic.

PHASE 7:
Implement duplicate detection.

PHASE 8:
Update Manufacturer management UI.

PHASE 9:
Update Product Entry Manufacturer selector.

PHASE 10:
Verify Product → Manufacturer relationships.

PHASE 11:
Run database, API, authorization and frontend tests.

PHASE 12:
Perform multi-organization manual verification.

============================================================
FINAL PRINCIPLE
============================================================

Do not model a real-world Manufacturer as belonging to an ERP Organization.

The Manufacturer exists independently.

Organizations merely create Products that reference that Manufacturer.

Therefore:

    Manufacturer
        ↓
    global independent master

while:

    Product
        ↓
    organization-owned catalog record

The same Manufacturer may therefore be referenced by Products belonging to many different Organizations.

There is no need for:

    organization_id on manufacturers

and no need for:

    organization_manufacturers

Keep the architecture as simple as possible while preserving:

    global manufacturer identity
    duplicate prevention
    product relationships
    multi-tenant isolation
    data integrity
    future verification capability.
