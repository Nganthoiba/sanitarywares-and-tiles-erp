You are working on an existing Laravel + React ERP application for:

- Tiles
- Sanitaryware
- Granite
- Marble
- CP fittings
- Accessories
- Other building materials

This is an EXISTING application.

IMPORTANT:
Before making any changes, thoroughly inspect the existing project,
including:

- migrations
- models
- relationships
- controllers
- services
- middleware
- policies
- authentication
- users
- roles
- permissions
- menus
- organization scoping
- React sidebar/navigation
- API authorization
- seeders
- configuration files

Do NOT blindly create a new authorization system.

Reuse and refactor the existing architecture wherever possible.

The objective is to establish a clean distinction between:

1. PLATFORM-LEVEL ADMINISTRATION
2. ORGANIZATION/TENANT-LEVEL ADMINISTRATION
3. ORGANIZATION STAFF

while simplifying the current architecture and removing the dependency
on config('permissions').

============================================================

1. # ARCHITECTURAL OBJECTIVE

The application has two major administrative scopes:

    PLATFORM
        ↓
    SUPER ADMIN

and:

    ORGANIZATION / TENANT
        ↓
    ORGANIZATION ADMIN
        ↓
    STAFF

The Super Admin operates at the platform level.

The Organization Admin operates within exactly one Organization.

Staff also belong to exactly one Organization.

The Super Admin is NOT an Organization user.

The Organization Admin is NOT a platform administrator.

These scopes must be enforced consistently throughout authentication,
authorization, database access, API access, and navigation.

============================================================ 2. USER ORGANIZATION RELATIONSHIP
============================================================

The current users table contains:

    organization_id

Historically this assumed every user belonged to an Organization.

That is no longer valid because the application has a platform-level
Super Admin.

Therefore:

    users.organization_id

must become nullable.

Expected states:

    SUPER_ADMIN
        organization_id = NULL

    ORGANIZATION_ADMIN
        organization_id = {organization_id}

    STAFF
        organization_id = {organization_id}

Do NOT create a fake/special Organization for Super Admin.

Do NOT use:

    organization_id = 0

or another artificial organization identifier.

NULL explicitly represents platform-level users who do not belong to a
tenant.

============================================================ 3. SINGLE SUPER ADMIN
============================================================

The current application is designed around a SINGLE Super Admin.

Do not introduce a complex hierarchy of platform administrators.

Use the existing RBAC architecture to represent:

    SUPER_ADMIN

if possible.

Do NOT add redundant fields such as:

    is_super_admin
    user_type
    admin_type
    role_type

unless inspection of the existing architecture proves that they are
actually required.

The Super Admin role must be platform-scoped.

============================================================ 4. RESPONSIBILITY MODEL
============================================================

The following responsibility matrix is authoritative for this
implementation.

---

## SUPER ADMIN — SYSTEM WIDE

The Super Admin is responsible for:

- Platform administration
- Tenant/Organization management
- Global master data
- System permissions
- Permission groups
- Default/system role templates
- Dynamic application menus
- Platform-level user administration
- Organization Admin administration
- Global governance and configuration

---

## ORGANIZATION ADMIN — TENANT SPECIFIC

The Organization Admin is responsible for:

- Organization profile
- Organization branches
- Warehouses
- Storage locations
- Organization-specific brands
- Organization-specific categories
- Organization products/product variants
- Suppliers
- Organization staff
- Staff roles/permission assignments
- Purchasing
- Purchase Orders
- GRNs
- Inventory
- Sales
- Customers
- Other normal business operations

The Organization Admin cannot manage another Organization.

The Organization Admin cannot create or modify system permission
definitions.

The Organization Admin cannot configure the global application menu.

============================================================ 5. TENANT MANAGEMENT
============================================================

The Super Admin can:

- Create Organizations
- Activate Organizations
- Suspend Organizations
- Configure Organizations at platform level
- Inspect Organizations
- View Organization status
- Manage Organization Admin accounts

The Organization Admin:

- Manages only their own Organization
- Cannot create/suspend/modify another Organization
- Cannot access another Organization's operational data

Do not give Super Admin ordinary business transaction responsibilities
such as routinely creating Purchase Orders, GRNs, Sales, or Inventory
transactions for Organizations.

Super Admin is a platform administrator, not an operational employee of
each tenant.

============================================================ 6. ORGANIZATION ADMINISTRATION
============================================================

Organization Admin can manage their own:

- Organization profile
- Branches
- Warehouses
- Storage locations
- Staff
- Organization-specific master data
- Products
- Purchasing
- Inventory
- Sales

All such records must remain correctly scoped to the Organization.

============================================================ 7. GLOBAL VS ORGANIZATION DATA
============================================================

The application must clearly distinguish GLOBAL data from
ORGANIZATION-SCOPED data.

---

## GLOBAL / PLATFORM DATA

Current global entities include:

- Manufacturers
- System UOM / unit definitions
- Global tax templates
- Permissions
- Permission groups
- System/default role templates
- Menus
- Platform configuration
- Platform-level users

---

## ORGANIZATION-SCOPED DATA

Current organization-specific entities include:

- Organization users
- Branches
- Warehouses
- Storage locations
- Brands
- Categories
- Products
- Product variants
- Suppliers
- Purchase Orders
- GRNs
- Inventory
- Sales
- Customers
- Organization-specific pricing
- Other business transactions

IMPORTANT:

Do not automatically globalize entities simply because they are
mentioned as possible global masters.

Only the entities explicitly established as global in this prompt
should be treated as global.

============================================================ 8. MANUFACTURER
============================================================

Manufacturer is a GLOBAL independent real-world entity.

The Manufacturer table must NOT contain:

    organization_id

Do NOT create:

    organization_manufacturers

The same Manufacturer can therefore be referenced by Products belonging
to multiple Organizations.

Example:

    Manufacturer:
        Kajaria Ceramics Limited

Organization A:

    Product A
        manufacturer_id = Kajaria

Organization B:

    Product B
        manufacturer_id = Kajaria

Both Products reference the same global Manufacturer.

The Super Admin is responsible for maintaining the canonical global
Manufacturer master.

Organization Admins can:

- Search Manufacturers
- Select Manufacturers
- Associate a Manufacturer with their Products

Organization Admins cannot directly create or modify canonical global
Manufacturer records.

Do not introduce a Workflow Engine for Manufacturer requests.

============================================================ 9. SYSTEM UOM
============================================================

System UOM definitions are global reference data.

The Super Admin manages the system's available UOM definitions.

Examples may include:

    PCS
    BOX
    SLAB
    MM
    CM
    M
    FT
    SQ.FT.
    SQ.M
    KG
    etc.

Do not confuse:

    UOM definition

with:

    Product-specific commercial conversion.

Product-specific conversions remain part of the Product/business
domain.

Do not introduce unnecessary UOM complexity during this task.

============================================================ 10. GLOBAL TAX TEMPLATES
============================================================

Global tax templates/reference definitions may be managed by the
Super Admin.

These represent reusable system-level tax information.

Organization transactions may consume the available tax templates.

Do not redesign the entire taxation subsystem as part of this task.

Reuse the existing tax architecture where possible.

============================================================ 11. DATABASE-DRIVEN PERMISSIONS
============================================================

IMPORTANT:

The application must NO LONGER use:

    config('permissions')

as the runtime source of truth.

The database must become the authoritative source of permissions.

Remove runtime dependency on:

    config('permissions')
    config("permissions")
    config('permissions.*')
    config("permissions.*")

Do not maintain two parallel permission sources.

The database is the runtime source of truth.

============================================================ 12. PERMISSIONS TABLE
============================================================

First inspect the existing permissions table.

If an appropriate permissions table already exists, reuse it.

Do NOT create a second permission table.

The conceptual permission structure should support:

    id
    name
    display_name
    description
    group_name
    enabled
    created_at
    updated_at

Use the actual existing naming conventions if they differ.

Permission `name` is the stable machine-readable identifier.

Examples:

    dashboard.view

    products.view
    products.create
    products.edit
    products.delete

    manufacturers.view
    manufacturers.manage

    suppliers.view
    suppliers.create
    suppliers.edit

    purchase.orders.view
    purchase.orders.create
    purchase.orders.approve
    purchase.orders.send

    inventory.view
    inventory.receive
    inventory.transfer
    inventory.adjust

    sales.view
    sales.create
    sales.edit

Do not create an unnecessarily huge list of permissions for features
that are not currently implemented.

Derive the initial permission catalogue from the application's actual
modules.

============================================================ 13. PERMISSION GROUPS
============================================================

Permission Groups are platform-level configuration.

The Super Admin can:

- Create permission groups
- Rename permission groups
- Enable/disable groups where appropriate
- Organize permissions into groups

Examples:

    Product Management
    Purchasing
    Inventory
    Sales
    Administration

Organization Admin cannot create system permission groups.

============================================================ 14. DEFAULT PERMISSIONS
============================================================

Default permissions must be created by database seeders during initial
application setup.

For example:

    PermissionSeeder

The seeder must be idempotent.

Running:

    php artisan db:seed

multiple times must not create duplicate permissions.

Use:

    upsert()
    updateOrCreate()

or the existing project convention.

The important principle is:

    Seeder = default initial data

    Database = runtime source of truth

============================================================ 15. PERMISSION MANAGEMENT
============================================================

Only Super Admin may manage permission definitions.

Super Admin can:

- Create permissions
- View permissions
- Edit permission metadata
- Enable/disable permissions
- Manage permission groups
- Safely retire permissions

Organization Admin cannot:

- Create permissions
- Rename permissions
- Delete permissions
- Modify permission definitions
- Create arbitrary application capabilities

Organization Admin can only use the permissions provided by the
platform.

============================================================ 16. ROLE ARCHITECTURE
============================================================

Inspect the existing roles/RBAC architecture before implementation.

Do NOT create a duplicate role system.

The conceptual hierarchy is:

    User
      ↓
    Role
      ↓
    Permission

At minimum, the application needs to distinguish:

    SUPER_ADMIN
    ORGANIZATION_ADMIN
    STAFF

The Super Admin role is platform-scoped.

Organization Admin and Staff roles are organization-scoped.

============================================================ 17. SYSTEM ROLE TEMPLATES
============================================================

The Super Admin may define default/system role templates.

Examples:

    Organization Admin
    Inventory Manager
    Purchase Officer
    Sales Staff
    Warehouse Staff

These templates describe available permission combinations.

Do not automatically make every role global.

If the existing RBAC architecture supports organization-specific roles,
reuse it.

The Organization Admin may assign available roles/permissions to their
own staff according to the existing RBAC design.

============================================================ 18. ORGANIZATION STAFF
============================================================

Organization Staff:

- Belong to exactly one Organization
- Receive roles/permissions through the existing RBAC system
- Can access only their Organization's data
- Can see only authorized menus
- Can perform only authorized API operations

Organization Admin remains responsible for inviting/managing ordinary
staff users.

============================================================ 19. USER MANAGEMENT
============================================================

SUPER ADMIN:

Can:

- View/manage users across Organizations
- Create/manage Organization Admin accounts
- Manage platform-level users
- Manage the single Super Admin account where appropriate

ORGANIZATION ADMIN:

Can:

- Invite staff
- Manage staff belonging to their own Organization
- Assign available roles/permissions to their own staff
- Activate/deactivate their own staff where supported

Organization Admin cannot manage users belonging to another
Organization.

============================================================ 20. DATABASE-DRIVEN MENUS
============================================================

The sidebar navigation must be database-driven.

The existing `menus` table is conceptually:

    id
    menu_name
    route_uri
    icon
    group_name
    parent_id
    permission_name
    order
    enabled
    created_at
    updated_at

Inspect the existing implementation first.

The long-term design must NOT use:

    permission_name

as a string linked to:

    config('permissions')

Instead, menus should reference database permissions.

Prefer:

    permission_id

with a foreign key to:

    permissions.id

if compatible with the existing RBAC architecture.

============================================================ 21. MENU → PERMISSION
============================================================

Every protected menu must be associated with a Permission.

Example:

    Menu:
        Purchase Orders

    Route:
        /purchase-orders

    Permission:
        purchase.orders.view

Database relationship:

    menus.permission_id
            ↓
    permissions.id

The Super Admin selects an existing Permission from the database when
creating/editing a menu.

Do NOT allow arbitrary permission strings to be entered manually.

============================================================ 22. MENU MANAGEMENT
============================================================

Super Admin has FULL CRUD authority over the menus table.

Super Admin can manage:

- Menu name
- Route URI
- Icon
- Parent menu
- Permission mapping
- Display order
- Enabled/disabled state
- Menu hierarchy

Organization Admin has NO menu-management authority.

Organization Admin and Staff are consumers of the resolved navigation.

Do not expose Menu Management to Organization Admin.

============================================================ 23. MENU HIERARCHY
============================================================

Retain:

    parent_id

for multi-level menus.

Example:

    Purchases
        ├── Purchase Orders
        ├── Goods Receipts
        └── Suppliers

The system must build the navigation tree dynamically.

A parent menu does not necessarily need its own permission.

If at least one authorized child exists, the parent can be displayed.

Do not display empty parent menus.

============================================================ 24. MENU ORDER
============================================================

Retain:

    order

to control the display order of menus at the same hierarchy level.

The React application must NOT hard-code sidebar ordering.

Ordering must come from the database.

============================================================ 25. MENU ENABLED STATE
============================================================

Retain:

    enabled

When:

    enabled = false

the menu must not be returned in the authorized navigation.

However:

    menu.enabled = false

does NOT mean that the underlying API permission is disabled.

Menu configuration and backend authorization remain separate concepts.

============================================================ 26. MENU GROUP_NAME
============================================================

Inspect the actual use of:

    group_name

in the current application.

Because:

    parent_id

already provides hierarchy, `group_name` may be redundant.

Do not remove it blindly.

If the current UI does not need it after inspection, remove it as part
of the cleanup.

Prefer:

    parent_id

as the canonical hierarchy mechanism.

============================================================ 27. MENU VISIBILITY
============================================================

The sidebar must be generated from the authenticated user's effective
permissions.

The desired flow is:

    Authenticate User
          ↓
    Resolve Effective Permissions
          ↓
    Resolve Enabled Menus
          ↓
    Build Menu Tree
          ↓
    Return Authorized Navigation
          ↓
    React renders Sidebar

The server should preferably return only menus that the user is
authorized to see.

Do not send the complete menu catalogue to ordinary users and merely
hide unauthorized items in React.

============================================================ 28. MENU IS NOT SECURITY
============================================================

IMPORTANT:

Menu visibility is NOT a security mechanism.

If a user does not have:

    purchase.orders.view

then:

    Purchase Orders

should not appear in the sidebar.

However, if that user manually accesses:

    /purchase-orders

or directly calls:

    GET /api/purchase-orders

the backend must independently enforce the required permission.

Therefore:

    Menu visibility
        =
    Navigation/UX

    Backend authorization
        =
    Security

    Domain validation
        =
    Business integrity

============================================================ 29. MENU PERMISSION SEMANTICS
============================================================

The permission associated with a menu should normally represent the
minimum permission required to access that module/page.

Example:

    Purchase Orders
        permission = purchase.orders.view

Additional action permissions control operations inside that module:

    purchase.orders.create
    purchase.orders.approve
    purchase.orders.send

Do NOT create separate menu permissions for every button.

Example:

    Purchase Orders
        → purchase.orders.view

    New Purchase Order
        → purchase.orders.create

    Approve
        → purchase.orders.approve

============================================================ 30. DYNAMIC NAVIGATION API
============================================================

Inspect the current API architecture.

If a suitable endpoint does not already exist, create an authenticated
endpoint for retrieving the current user's authorized navigation.

For example:

    GET /api/navigation

or an equivalent route consistent with the existing project.

The response should contain only authorized, enabled menus.

The response should contain enough information for React to construct:

- Menu hierarchy
- Labels
- Routes
- Icons
- Ordering
- Children

Do not expose unnecessary internal information.

============================================================ 31. SUPER ADMIN NAVIGATION
============================================================

The Super Admin should have platform-level navigation.

Conceptually:

    Dashboard

    Platform Administration
        ├── Organizations
        ├── Users
        ├── Roles
        ├── Permissions
        ├── Permission Groups
        ├── Menus
        └── Manufacturers

The actual sidebar must still be database-driven.

Do NOT hard-code this structure exclusively in React.

============================================================ 32. ORGANIZATION NAVIGATION
============================================================

Organization Admin/Staff navigation should be based on their effective
permissions.

Example:

    Products
        └── Product Catalog

    Purchases
        ├── Purchase Orders
        └── Goods Receipts

    Inventory
        └── Stock

A user without:

    inventory.adjust

must not see:

    Stock Adjustment

when that menu is associated with `inventory.adjust`.

============================================================ 33. PERMISSION-BASED UI ACTIONS
============================================================

The React application may use effective permissions to:

- Show/hide buttons
- Disable actions
- Show/hide menu items
- Control available UI operations

But all actual authorization must be enforced server-side.

Never rely on React permission checks for security.

============================================================ 34. GLOBAL MANUFACTURER MANAGEMENT
============================================================

Super Admin has full management authority over the global Manufacturer
master.

Organization Admin consumes Manufacturer records.

Do not expose canonical Manufacturer creation/editing to Organization
Admin in the normal workflow.

If the UI currently allows Organization Admin to create Manufacturers,
refactor it accordingly.

Do not introduce:

    organization_id

to Manufacturer.

Do not create:

    organization_manufacturers

============================================================ 35. ORGANIZATION-SPECIFIC MASTER DATA
============================================================

Organization Admin remains responsible for tenant-specific:

- Brands
- Categories
- Products
- Product Variants
- Storage Locations
- Other organization-owned master data

Do not accidentally make these global during this task.

============================================================ 36. ORGANIZATION BUSINESS OPERATIONS
============================================================

Organization Admin is the operational administrator of the business.

They can manage:

    Suppliers
    Purchase Orders
    GRNs
    Inventory
    Stock Transfers
    Stock Adjustments
    Sales
    Customers

according to their assigned permissions.

Super Admin should not normally perform these transactions on behalf
of an Organization.

============================================================ 37. ORGANIZATION ISOLATION
============================================================

Normal organization users must remain tenant-scoped.

Organization A must not access:

    Organization B's

- Users
- Branches
- Warehouses
- Products
- Suppliers
- Purchase Orders
- GRNs
- Inventory
- Sales
- Customers
- Organization-specific data

The Super Admin is the explicit platform-level exception.

However, Super Admin access must still be controlled and auditable.

============================================================ 38. TENANT SCOPING
============================================================

Inspect the current organization-scoping implementation.

If a global scope, middleware, trait, repository, policy, or service
already exists, reuse it.

Do not introduce duplicate tenant-isolation mechanisms.

The final architecture should make it difficult to accidentally omit:

    organization_id

from organization-owned queries.

For global resources, do not apply organization filtering.

Examples of global resources:

    Manufacturer
    Permission
    Menu

============================================================ 39. SUPER ADMIN TENANT EXCEPTION
============================================================

Do not implement Super Admin access by simply removing all
organization filters everywhere.

Instead:

    Platform-level resource
        → global access according to permission

    Organization resource
        → organization-scoped access for normal users

    Super Admin
        → explicitly authorized cross-organization/platform access

Do not create a blanket uncontrolled bypass.

============================================================ 40. AUDITABILITY
============================================================

Inspect whether the application already has an audit mechanism.

Reuse it if available.

Sensitive Super Admin operations should be auditable, including:

- Organization created
- Organization suspended
- Organization activated
- Organization Admin created/changed
- Permission created
- Permission modified
- Permission disabled
- Permission group modified
- Menu created
- Menu modified
- Menu disabled
- Manufacturer created
- Manufacturer modified

Do not introduce a completely separate audit architecture if one
already exists.

============================================================ 41. REMOVE CONFIG-BASED PERMISSIONS
============================================================

Search the ENTIRE codebase for:

    config('permissions')
    config("permissions")
    config('permissions.')
    config("permissions.")
    permissions.php
    permission_name

Identify all usages.

Refactor runtime authorization to use database-backed permissions.

Do not leave:

    config permissions

and:

    database permissions

as competing sources of truth.

The database is authoritative.

============================================================ 42. PERMISSION SERVICE / AUTHORIZATION
============================================================

Inspect the existing authorization implementation.

If an authorization/permission service already exists, refactor it.

If not, introduce ONE centralized service appropriate for the existing
architecture.

Do not scatter direct permission queries across controllers,
components, and services.

The application should have a consistent mechanism for:

- Checking permissions
- Resolving effective permissions
- Resolving authorized menus
- Authorizing API actions

Use Laravel Gates/Policies/Middleware where appropriate.

============================================================ 43. STABLE PERMISSION IDENTIFIERS
============================================================

Permission names such as:

    purchase.orders.view

should be stable machine-readable identifiers.

Display names can change.

Do not use:

    permission display name

as the authorization identifier.

Do not hard-code permission IDs.

Use stable permission names in application code and resolve them
against database records.

============================================================ 44. DEFAULT MENU SEEDING
============================================================

Menus must also be seeded into the database.

For example:

    MenuSeeder

The correct dependency order is:

    PermissionSeeder
          ↓
    RoleSeeder / Role Template Seeder
          ↓
    Role-Permission assignments
          ↓
    MenuSeeder
          ↓
    SuperAdminSeeder
          ↓
    Other required seeders

Adapt this order to the existing project architecture.

MenuSeeder must resolve Permissions by stable names.

Do NOT hard-code permission IDs.

Do NOT hard-code menu IDs.

============================================================ 45. SEEDER IDEMPOTENCY
============================================================

Default seeders must be safe to execute multiple times.

Do not create duplicate:

- Permissions
- Permission Groups
- Roles
- Menus
- Super Admin account

Use appropriate unique keys and:

    updateOrCreate()
    upsert()

or the existing project convention.

============================================================ 46. EXISTING PERMISSION DATA
============================================================

If the current application already has permission data derived from:

    config('permissions')

create a safe migration/seeding strategy.

Map existing permission names into the database.

Do not destroy existing role/permission relationships without a clear
migration path.

============================================================ 47. EXISTING MENU DATA
============================================================

If existing menus contain:

    permission_name

map those values to:

    permission_id

using the corresponding database Permission.

If an existing menu references a permission that cannot be resolved:

    DO NOT silently assign another permission.

Report the unresolved reference and handle it explicitly.

============================================================ 48. DATABASE MIGRATIONS
============================================================

Create additive migrations where required.

Potential schema changes include:

1. Make users.organization_id nullable.
2. Add/update database-backed Permission fields if necessary.
3. Add permission group support if required by the existing schema.
4. Add menus.permission_id.
5. Add foreign key from menus.permission_id to permissions.id.
6. Remove obsolete menu.permission_name after data migration where
   appropriate.
7. Remove obsolete permission configuration dependencies.
8. Add required indexes/constraints.

Do not rewrite already-executed historical migrations unless the
project's deployment state explicitly permits it.

============================================================ 49. MENU PERMISSION FOREIGN KEY
============================================================

Prefer:

    menus.permission_id

over:

    menus.permission_name

The relationship should be:

    menus.permission_id
            ↓
    permissions.id

Use appropriate foreign-key behavior.

If a Permission is deleted or retired, ensure existing Menus do not
become invalid.

Prefer disabling/retiring permissions over destructive deletion when
they are referenced by roles or menus.

============================================================ 50. PERMISSION DELETION
============================================================

Do not blindly hard-delete Permissions.

A Permission may be referenced by:

- Roles
- Role-permission assignments
- Menus
- Policies
- Other authorization structures

Prefer:

    enabled = false

for retiring permissions where appropriate.

If hard deletion is supported, enforce dependency checks first.

============================================================ 51. MENU DELETION
============================================================

Menus may have children.

Do not allow accidental deletion of an entire navigation hierarchy.

Use appropriate confirmation and dependency checks.

============================================================ 52. WORKFLOW ENGINE
============================================================

The generic Workflow Engine is OUT OF SCOPE for the current version.

Do NOT add new Workflow Engine functionality.

The current application should use explicit domain-specific business
statuses and permission checks.

Do not introduce workflow definitions, workflow transitions,
workflow instances, workflow conditions, or workflow execution logic
into this architecture.

Existing Workflow-related infrastructure should be audited separately
for removal as part of the database simplification effort.

Do not use a Workflow Engine for:

- Permission management
- Menu management
- Manufacturer management
- Organization administration
- Purchase Order approval

============================================================ 53. BUSINESS STATUS VS WORKFLOW
============================================================

Do not confuse domain statuses with a generic Workflow Engine.

For example, Purchase Order states such as:

    DRAFT
    SUBMITTED
    APPROVED
    SENT
    PARTIALLY_RECEIVED
    FULLY_RECEIVED
    CLOSED
    CANCELLED

are valid domain-specific business states.

They may remain.

The current decision is:

    Domain-specific states = YES

    Generic configurable Workflow Engine = NO

============================================================ 54. SUPER ADMIN RESPONSIBILITY SUMMARY
============================================================

The final Super Admin responsibility model is:

    SUPER ADMIN
        │
        ├── Organization Management
        │     ├── Create
        │     ├── Activate
        │     ├── Suspend
        │     └── Inspect
        │
        ├── Global Master Data
        │     ├── Manufacturers
        │     ├── System UOM
        │     └── Global Tax Templates
        │
        ├── Security
        │     ├── Permissions
        │     ├── Permission Groups
        │     └── System/Default Role Templates
        │
        ├── Navigation
        │     └── Menus
        │
        └── Platform Users
              └── Organization Admins
