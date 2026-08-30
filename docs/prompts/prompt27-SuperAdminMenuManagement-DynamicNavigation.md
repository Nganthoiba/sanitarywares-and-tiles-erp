You are working on the existing Laravel + React ERP application for:

- Tiles
- Sanitaryware
- Granite
- Marble
- CP fittings
- Accessories
- Other building materials

This is an EXISTING application.

IMPORTANT:
Before implementing anything, inspect the current project, especially:

- menus migration
- Menu model
- existing menu controllers/services
- permissions migration/model
- roles and RBAC implementation
- users and authentication
- existing sidebar/navigation React components
- React routing
- API routes
- middleware/policies/Gates
- existing organization/scope logic
- existing seeders

Do not create a second menu, permission, or authorization system.

Reuse and refactor the existing architecture wherever appropriate.

============================================================

1. # OBJECTIVE

Implement a database-driven:

    MENU MANAGEMENT

module that allows the application's navigation structure to be
configured dynamically.

IMPORTANT:

ONLY THE SUPER ADMIN IS AUTHORIZED TO ACCESS AND USE MENU MANAGEMENT.

The following users MUST NOT have access:

- Organization Admin
- Organization Staff
- Any other organization-scoped user

Menu Management is a PLATFORM-LEVEL administration function.

The Super Admin controls the application's navigation structure for
the entire platform.

============================================================ 2. RESPONSIBILITY
============================================================

Super Admin is responsible for:

- Creating menus
- Editing menus
- Deleting menus
- Enabling/disabling menus
- Creating menu hierarchy
- Assigning menu permissions
- Configuring routes
- Configuring icons
- Configuring menu order
- Managing navigation structure

Organization Admin and Staff are only consumers of the resulting
navigation.

They cannot:

- Create menus
- Edit menus
- Delete menus
- Reorder menus
- Enable/disable menus
- Change menu permissions
- Change routes
- Change icons

Do not expose Menu Management anywhere in the Organization Admin UI.

============================================================ 3. IMPORTANT ARCHITECTURAL PRINCIPLE
============================================================

Menu Management configures NAVIGATION.

It does NOT replace backend authorization.

The relationship is:

    Super Admin
        ↓
    Menu Configuration
        ↓
    Database
        ↓
    Authorized Navigation
        ↓
    User Sidebar

But backend APIs must independently enforce permissions.

For example:

    User does not have:
        purchase.orders.view

Then:

    Purchase Orders menu
        → must not appear

AND:

    GET /api/purchase-orders
        → must also be rejected

Never rely on hiding a menu as a security mechanism.

============================================================ 4. DATABASE-DRIVEN PERMISSIONS
============================================================

Permissions are now database-driven.

DO NOT use:

    config('permissions')

as the source of truth.

The `permissions` table is the authoritative runtime source.

The menu must reference an actual database Permission.

Prefer:

    menus.permission_id

instead of:

    menus.permission_name

The relationship should be:

    menus.permission_id
            ↓
    permissions.id

Do not allow arbitrary permission strings to be entered into the
Menu Management form.

The Super Admin must select an existing Permission from the database.

============================================================ 5. CURRENT MENU STRUCTURE
============================================================

Inspect the current `menus` migration.

The existing structure includes concepts such as:

    id
    menu_name
    route_uri
    icon
    group_name
    parent_id
    permission_name
    order
    enabled
    timestamps

Refactor this structure where necessary.

The preferred conceptual structure is:

    menus
    ─────────────────────────────
    id
    menu_name
    menu_type
    route_uri
    icon
    parent_id
    permission_id
    order
    enabled
    created_at
    updated_at

Do not blindly add fields if equivalent fields already exist.

Do not create duplicate menu tables.

============================================================ 6. MENU TYPE
============================================================

Introduce a simple menu type if the current architecture does not
already provide an equivalent concept.

Initially support:

    GROUP
    PAGE

GROUP:

Represents a navigation container.

Example:

    Purchases

It may have:

    route_uri = NULL
    permission_id = NULL

PAGE:

Represents a navigable application page.

Example:

    Purchase Orders

It has:

    route_uri = /purchase-orders
    permission_id = purchase.orders.view

Do NOT introduce unnecessary menu types.

Do not implement external links unless the existing application
actually requires them.

============================================================ 7. MENU GROUP / PARENT HIERARCHY
============================================================

Use:

    parent_id

as the primary mechanism for menu hierarchy.

Example:

    Purchases
        ├── Purchase Orders
        ├── Goods Receipts
        └── Suppliers

Database:

    Purchases
        parent_id = NULL

    Purchase Orders
        parent_id = Purchases.id

    Goods Receipts
        parent_id = Purchases.id

    Suppliers
        parent_id = Purchases.id

Do not duplicate this hierarchy using another required
`group_name` field.

Inspect the existing `group_name` usage first.

If `group_name` is redundant and has no meaningful UI/functionality,
remove it through an appropriate migration.

============================================================ 8. PARENT MENU PERMISSION
============================================================

A GROUP menu does not necessarily require a permission.

For example:

    Purchases
        ├── Purchase Orders
        ├── Goods Receipts
        └── Suppliers

Permissions:

    purchase.orders.view
    purchase.grn.view
    suppliers.view

There does not need to be:

    purchase.menu.view

The parent should be visible when at least one authorized child is
available to the user.

If the user has none of the child permissions:

    Purchases

must not be displayed.

Do not display empty parent menus.

============================================================ 9. MENU PERMISSION SEMANTICS
============================================================

A PAGE menu should normally use the minimum permission required to
access that page.

Example:

    Menu:
        Purchase Orders

    Route:
        /purchase-orders

    Permission:
        purchase.orders.view

Additional permissions control actions inside the page.

For example:

    purchase.orders.view
    purchase.orders.create
    purchase.orders.approve
    purchase.orders.send

Do NOT create a separate menu permission for every button.

============================================================ 10. MENU MANAGEMENT UI
============================================================

Create a professional Super Admin interface inspired by the provided
reference design.

Use a two-column layout.

LEFT SIDE:

    Navigation Tree

RIGHT SIDE:

    Menu Editor

The overall page should communicate:

    Menu Management

    Configure and order system-wide navigation menus and routes.

============================================================ 11. LEFT PANEL — NAVIGATION TREE
============================================================

The left panel displays the current menu hierarchy.

Example:

    Main Navigation

        ⋮ Dashboard

        ⋮ Products
            ⋮ Product Catalog
            ⋮ Categories
            ⋮ Brands

        ⋮ Purchases
            ⋮ Purchase Orders
            ⋮ Goods Receipts
            ⋮ Suppliers

        ⋮ Inventory
            ⋮ Stock
            ⋮ Stock Transfers
            ⋮ Stock Adjustments

        ⋮ Sales
            ⋮ Sales
            ⋮ Customers

        ⋮ Reports
            ⋮ Sales Reports
            ⋮ Purchase Reports
            ⋮ Inventory Reports

Use clear visual indentation for parent/child relationships.

Use drag handles for ordering.

The tree must clearly distinguish:

    GROUP
    PAGE

using an appropriate icon or visual treatment.

============================================================ 12. DRAG-AND-DROP ORDERING
============================================================

Super Admin must be able to reorder menu items using drag-and-drop.

Dragging should update the menu `order` values.

Example:

Before:

    Products
    Purchases
    Inventory
    Sales

After dragging:

    Products
    Inventory
    Purchases
    Sales

The database order must be updated.

Support reordering within the same parent level.

If practical within the existing architecture, also allow moving a
menu under a different parent.

However, do not implement unnecessarily complex tree manipulation if
the current UI architecture does not support it reliably.

All changes must be persisted safely.

============================================================ 13. ADD MENU ITEM
============================================================

Provide:

    + Add Menu

or:

    + Add Menu Item

The form should open in the right-side editor rather than navigating
to a completely separate page.

The Super Admin should be able to create:

    GROUP

or:

    PAGE

============================================================ 14. MENU EDITOR
============================================================

The Menu Editor should contain the following core fields.

---

## Menu Label \*

Example:

    Purchase Orders

This is the text displayed in the sidebar.

---

## Menu Type \*

Options:

    Group
    Page

---

## Icon

Allow the Super Admin to select an icon from the application's
supported icon set.

Do not allow arbitrary unsafe HTML or JavaScript.

---

## Route URI

Required for:

    PAGE

Not required for:

    GROUP

Example:

    /purchase-orders

---

## Parent Menu

Dropdown/tree selector.

Options should include:

    None / Root Level
    Purchases
    Inventory
    Sales
    etc.

Do not allow a menu to select itself as its parent.

Prevent circular parent relationships.

---

## Permission

Required for protected PAGE menus.

Select from existing database Permissions.

Example:

    Purchase Orders — View Purchase Orders

The Super Admin should NOT type the permission string manually.

For GROUP menus, Permission may normally be NULL.

---

## Display Order

Allow precise ordering.

The primary UX for ordering should still be drag-and-drop.

---

## Enabled

ON / OFF

When disabled:

    The menu is not displayed in navigation.

However, disabling a menu does NOT disable the underlying Permission
or API.

============================================================ 15. ROUTE HANDLING
============================================================

The Route URI must correspond to an actual application route.

Do not allow the Super Admin to create arbitrary routes that do not
exist in the React/Laravel application.

Inspect the existing routing architecture.

Prefer a route selector/searchable list of known internal routes if
practical.

If the existing architecture requires manual route entry, validate the
route appropriately.

Do not execute route strings dynamically.

Do not allow JavaScript URLs.

Do not allow unsafe external URL injection.

============================================================ 16. ICON HANDLING
============================================================

The menu icon must come from the application's supported icon set.

Do not store arbitrary HTML.

Do not render user-provided HTML as an icon.

The database should store a safe icon identifier/class.

Example:

    shopping-cart
    boxes
    users
    settings

The React sidebar maps these identifiers to the application's icon
components.

============================================================ 17. SAVE BEHAVIOR
============================================================

The Super Admin should be able to edit a menu and click:

    Save Changes

Changes should persist through the backend API.

Do not rely on local React state as the permanent source.

The database remains authoritative.

After saving:

    Refreshing the page

must preserve the new configuration.

============================================================ 18. DELETE MENU
============================================================

Super Admin may delete a menu.

Before deletion:

- Confirm the operation.
- Check whether the menu has children.
- Prevent accidental deletion of an entire hierarchy.
- Handle child menus safely.

If a GROUP contains children:

    Do not silently delete all children.

Either:

    prevent deletion

or:

    require an explicit confirmation and implement a safe child
    handling strategy.

Do not leave orphaned menus.

============================================================ 19. ENABLE / DISABLE
============================================================

Super Admin can disable a menu.

Disabled menus:

    enabled = false

must not appear in the navigation response.

Disabling a menu does NOT:

    disable its Permission

and does NOT:

    disable its API endpoint.

The menu controls navigation only.

============================================================ 20. NAVIGATION API
============================================================

Provide an authenticated API endpoint for retrieving the current
user's authorized navigation.

For example:

    GET /api/navigation

Use the project's existing API conventions if a different endpoint
pattern is already established.

The backend should:

1. Authenticate the user.
2. Resolve the user's effective permissions.
3. Retrieve enabled menus.
4. Determine which PAGE menus the user may access.
5. Build the parent/child hierarchy.
6. Remove empty parent groups.
7. Sort menus by their configured order.
8. Return the final navigation tree.

The frontend should receive the already-authorized navigation.

============================================================ 21. SUPER ADMIN NAVIGATION
============================================================

The Super Admin itself should receive the platform administration
menus according to its permissions.

Conceptually:

    Dashboard

    Platform Administration
        ├── Organizations
        ├── Users
        ├── Roles
        ├── Permissions
        ├── Permission Groups
        ├── Menu Management
        └── Manufacturers

Do not hard-code this entire sidebar exclusively in React.

These menus should themselves be represented by the database-driven
menu system.

============================================================ 22. MENU MANAGEMENT ACCESS
============================================================

Menu Management must be protected by a dedicated permission, for
example:

    menus.manage

or an equivalent stable permission name.

The important requirement is:

    ONLY SUPER ADMIN

may possess this permission.

Do not grant:

    menus.manage

to Organization Admin or Staff.

Even if someone manually calls:

    /menu-management

the backend must reject unauthorized users.

============================================================ 23. DOUBLE PROTECTION
============================================================

Menu Management has two layers of protection:

Layer 1:

    Navigation

Only Super Admin sees:

    Menu Management

Layer 2:

    Backend authorization

Only Super Admin can call:

    Menu CRUD APIs

Do not rely on the hidden sidebar to protect the feature.

============================================================ 24. MENU MANAGEMENT API
============================================================

Inspect existing API conventions and implement appropriate endpoints.

Conceptually:

    GET    /api/admin/menus
    POST   /api/admin/menus
    GET    /api/admin/menus/{id}
    PUT    /api/admin/menus/{id}
    DELETE /api/admin/menus/{id}

Additional endpoint if necessary:

    POST /api/admin/menus/reorder

or an equivalent RESTful implementation.

All endpoints must require the Super Admin's menu-management
authorization.

Do not expose these APIs to ordinary Organization users.

============================================================ 25. PERMISSION SELECTOR
============================================================

The Menu Editor must load available Permissions from the database.

Example:

    Permission *

    [ Purchase Orders — View Purchase Orders ▼ ]

The selector should display human-readable information.

For example:

    Purchase Orders — View
    Purchase Orders — Create
    Purchase Orders — Approve

rather than only:

    purchase.orders.view

The underlying stored value remains the Permission's database ID.

============================================================ 26. MENU PREVIEW
============================================================

If practical, provide a small visual indication of how the menu will
appear in the sidebar.

For example:

    🛒  Purchase Orders

This is optional and should not complicate the first implementation.

The actual sidebar remains the authoritative visual result.

============================================================ 27. UNSAVED CHANGES
============================================================

If the Super Admin changes menu properties and attempts to navigate
away before saving, warn about unsaved changes if practical.

This is especially important for drag-and-drop reordering.

Do not silently lose menu configuration changes.

============================================================ 28. CONCURRENCY / SAFE UPDATES
============================================================

Menu configuration is platform-wide.

Avoid overwriting unrelated menu changes when multiple requests occur.

For reorder operations:

- Use a transaction.
- Update affected order values consistently.
- Ensure there are no duplicate/invalid ordering states that break
  navigation.

Do not over-engineer concurrency for the current application size.

============================================================ 29. MENU VALIDATION
============================================================

Backend validation must enforce:

    menu_name
        required

    menu_type
        required
        valid GROUP/PAGE value

    route_uri
        required for PAGE
        nullable for GROUP

    parent_id
        nullable
        must reference an existing menu

    permission_id
        required for PAGE where the application requires authorization
        nullable for GROUP

    order
        valid numeric/integer value

    enabled
        boolean

Additional validation:

- A menu cannot be its own parent.
- Circular parent relationships are forbidden.
- Parent menu must be valid.
- A PAGE cannot have an invalid route.
- Permission must exist.
- Permission must be enabled where appropriate.

============================================================ 30. MENU TREE VALIDATION
============================================================

The backend must protect the integrity of the menu tree.

Prevent:

    A → B
    B → A

or:

    A → B → C → A

Prevent orphaned children.

Prevent invalid parent references.

The menu tree must always remain traversable.

============================================================ 31. DATABASE MIGRATION
============================================================

Inspect the existing `menus` migration before changing it.

If the current schema contains:

    permission_name

and permissions are now database-driven, migrate to:

    permission_id

where appropriate.

Do not blindly rewrite an already-executed migration.

Create an additive migration if required.

Potential final structure:

    menus
    ─────────────────────────
    id
    menu_name
    menu_type
    route_uri
    icon
    parent_id
    permission_id
    order
    enabled
    created_at
    updated_at

Use appropriate:

- indexes
- foreign keys
- unique constraints where justified

Do not add unnecessary fields merely because they exist in the
reference screenshot.

============================================================ 32. REMOVE REDUNDANT FIELDS
============================================================

Review:

    group_name
    permission_name

in the existing menus table.

`permission_name` should be removed after safely migrating to:

    permission_id

`group_name` should only remain if the existing application has a
real functional need for it.

Do not retain redundant fields merely for compatibility if they have
no purpose.

============================================================ 33. DEFAULT MENU SEEDER
============================================================

Create/update:

    MenuSeeder

Default menus should be populated during initial project setup.

MenuSeeder must:

1. Resolve permissions from the database.
2. Create parent menus.
3. Create child menus.
4. Assign permission_id.
5. Set default order.
6. Set enabled = true where appropriate.

Do not hard-code:

    permission IDs
    menu IDs

Use stable permission names to resolve database IDs.

============================================================ 34. SEEDING ORDER
============================================================

The initial setup should follow the correct dependency order:

    PermissionSeeder
          ↓
    Role/Role Template Seeder
          ↓
    Role-Permission Seeder
          ↓
    MenuSeeder
          ↓
    SuperAdminSeeder

Adapt to the existing project seeding architecture.

============================================================ 35. IDEMPOTENT SEEDING
============================================================

MenuSeeder must be idempotent.

Running the seeders repeatedly must not create duplicate menus.

Use stable identifiers and appropriate:

    updateOrCreate()
    upsert()

or the project's established approach.

============================================================ 36. REACT SIDEBAR
============================================================

Refactor the existing React sidebar so that it consumes the
authorized navigation returned by the backend.

Do not maintain a second hard-coded menu catalogue in React.

The database is the source of truth.

The React sidebar should:

- Render the returned hierarchy.
- Respect ordering.
- Render icons.
- Render parent/child menus.
- Hide disabled/unauthorized menus.
- Navigate using the configured route.

============================================================ 37. ROUTE DEFINITIONS VS MENU DEFINITIONS
============================================================

Do not confuse:

    React/Laravel Route

with:

    Menu

A route defines an application endpoint/page.

A menu provides navigation to that route.

Menu Management must not create arbitrary application functionality.

For example:

    /purchase-orders

must already be implemented as a valid application route.

Menu Management simply determines whether and where it appears in the
navigation.

============================================================ 38. NO AUTOMATIC PERMISSION CREATION
============================================================

When creating a Menu:

    DO NOT automatically create a Permission.

The Super Admin must select an existing Permission.

Permission creation is a separate platform administration function.

This prevents accidental creation of unnecessary permissions.

============================================================ 39. NO ORGANIZATION-SPECIFIC MENUS
============================================================

The current menu system is PLATFORM-WIDE.

Do NOT add:

    organization_id

to menus.

Do NOT create:

    organization_menus

for the current implementation.

A single platform menu configuration is consumed by all Organizations,
while visibility differs according to the user's permissions.

Example:

    Purchase Orders
        permission = purchase.orders.view

Organization A Staff:

    has purchase.orders.view
        → sees menu

Organization B Staff:

    does not have purchase.orders.view
        → does not see menu

The menu itself remains global.

============================================================ 40. SECURITY
============================================================

Menu Management is a high-privilege platform administration feature.

Enforce authorization at:

- API layer
- Controller/service layer where appropriate
- React UI
- Navigation

The backend is authoritative.

Do not trust:

- hidden buttons
- hidden menus
- React state
- client-supplied user roles
- client-supplied permission information

============================================================ 41. AUDITABILITY
============================================================

Inspect the existing audit system.

If available, use it for Super Admin menu operations.

Important actions:

    Menu created
    Menu modified
    Menu deleted
    Menu enabled
    Menu disabled
    Menu reordered
    Menu permission changed
    Menu parent changed
    Menu route changed

Do not introduce a separate audit system if an appropriate one
already exists.

============================================================ 42. UI/UX REQUIREMENTS
============================================================

Use Bootstrap 5 and the existing project's UI conventions.

The design should be clean, professional, and appropriate for an ERP.

Recommended layout:

    ---------------------------------------------------------
    | Menu Management                         [+ Add Menu]  |
    | Configure system-wide navigation                     |
    ---------------------------------------------------------
    |                                                       |
    | Navigation Tree              | Edit Menu              |
    |                              |                        |
    | Main Navigation              | Menu Label *           |
    |                              | [................]      |
    | ⋮ Dashboard                  |                        |
    |                              | Menu Type              |
    | ⋮ Products                   | [Page ▼]               |
    |   ⋮ Catalog                  |                        |
    |   ⋮ Categories               | Icon                   |
    |                              | [................]      |
    | ⋮ Purchases                  |                        |
    |   ⋮ Purchase Orders          | Route URI              |
    |   ⋮ Goods Receipts           | [................]      |
    |                              |                        |
    | ⋮ Inventory                  | Parent Menu            |
    |   ⋮ Stock                    | [................]      |
    |                              |                        |
    | ⋮ Sales                      | Permission             |
    |   ⋮ Sales                    | [................]      |
    |                              |                        |
    |                              | Display Order          |
    |                              | [................]      |
    |                              |                        |
    |                              | Enabled [ ON ]         |
    |                              |                        |
    |                              | [Delete] [Save]       |
    ---------------------------------------------------------

Do not copy the reference screenshot literally.

Use it only as a UX inspiration.

============================================================ 43. KEEP THE FORM SIMPLE
============================================================

Do NOT add unnecessary fields such as:

- Badge configuration
- Live metrics
- External URLs
- Custom CSS
- Arbitrary HTML
- JavaScript
- Advanced visibility rules
- Organization-specific menu targeting

unless the existing application genuinely requires them.

The first implementation should focus on:

    Menu Label
    Menu Type
    Icon
    Route
    Parent
    Permission
    Order
    Enabled

============================================================ 44. TESTING
============================================================

Create/update automated tests for:

AUTHORIZATION:

1. Super Admin can access Menu Management.
2. Organization Admin cannot access Menu Management.
3. Staff cannot access Menu Management.
4. Unauthorized users cannot call Menu CRUD APIs.

CRUD:

5. Super Admin can create a GROUP menu.
6. Super Admin can create a PAGE menu.
7. Super Admin can edit a menu.
8. Super Admin can delete a menu safely.
9. Super Admin can enable/disable a menu.
10. Super Admin can change menu permission.
11. Super Admin can change parent.
12. Super Admin can reorder menus.

VALIDATION:

13. PAGE requires valid route.
14. Invalid permission is rejected.
15. GROUP can have NULL route.
16. Invalid parent is rejected.
17. Self-parenting is rejected.
18. Circular hierarchy is rejected.

NAVIGATION:

19. Authorized users receive enabled menus.
20. Unauthorized users do not receive protected menus.
21. Parent menu disappears when all children are unauthorized.
22. Menu ordering works.
23. Parent/child hierarchy works.
24. Disabled menus are excluded.

SECURITY:

25. Hiding the menu does not bypass API authorization.
26. Organization users cannot manipulate menus through direct API calls.

DATABASE:

27. Menu permission references actual Permission record.
28. MenuSeeder is idempotent.
29. Existing permission references are migrated safely.

============================================================ 45. MANUAL VERIFICATION
============================================================

SCENARIO 1:

Login as Super Admin.

Expected:

    Platform Administration
        → Menu Management

is visible.

---

SCENARIO 2:

Login as Organization Admin.

Expected:

    Menu Management

is NOT visible.

Attempt to manually access:

    /menu-management

Expected:

    Access denied.

---

SCENARIO 3:

Super Admin creates:

    Group:
        Purchases

Then creates:

    Page:
        Purchase Orders

    Route:
        /purchase-orders

    Permission:
        purchase.orders.view

Expected:

    Purchases
        └── Purchase Orders

appears in the navigation tree.

---

SCENARIO 4:

Disable:

    Purchase Orders

Expected:

    The menu disappears from the sidebar.

The permission itself remains enabled.

---

SCENARIO 5:

Assign:

    purchase.orders.view

to Staff A.

Do not assign it to Staff B.

Expected:

    Staff A:
        sees Purchase Orders

    Staff B:
        does not see Purchase Orders

---

SCENARIO 6:

Remove:

    purchase.orders.view

from Staff A.

Expected:

    Purchase Orders disappears from Staff A's sidebar.

---

SCENARIO 7:

Delete a parent menu that contains children.

Expected:

    The system prevents accidental orphaning/deletion.

---

SCENARIO 8:

Attempt to make:

    Menu A → Parent = Menu A

Expected:

    Validation error.

---

SCENARIO 9:

Attempt to create a circular hierarchy:

    A → B
    B → C
    C → A

Expected:

    Validation error.

============================================================ 46. FINAL ARCHITECTURE
============================================================

The final architecture should be:

                    SUPER ADMIN
                         │
                         ▼
                MENU MANAGEMENT
                         │
                         ▼
                      menus
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       parent_id     permission_id     order
          │              │
          │              ▼
          │         permissions
          │              │
          └──────┬───────┘
                 ▼
           MENU TREE
                 │
                 ▼
        USER EFFECTIVE PERMISSIONS
                 │
                 ▼
       AUTHORIZED NAVIGATION
                 │
                 ▼
           REACT SIDEBAR

IMPORTANT:

    Menu Management = PLATFORM-LEVEL ONLY

    Super Admin = ONLY authorized administrator

    Organization Admin = READ-ONLY consumer of navigation

    Staff = READ-ONLY consumer of navigation

============================================================ 47. FINAL PRINCIPLES
============================================================

1. Menu Management is exclusively a Super Admin function.

2. Menus are global platform configuration.

3. menus.organization_id must NOT be introduced.

4. organization_menus must NOT be introduced.

5. Permissions are stored in the database.

6. config('permissions') is not used.

7. Every protected PAGE menu references a database Permission.

8. GROUP menus may have no permission.

9. Parent menus are built using parent_id.

10. Empty parent menus are hidden from users.

11. Menu order is database-driven.

12. Menu enabled/disabled state is database-driven.

13. Menu Management itself is protected by a dedicated permission.

14. Only Super Admin may possess the permission to manage menus.

15. Organization Admin cannot create, edit, delete, reorder, or disable
    menus.

16. Staff cannot manage menus.

17. Menu visibility is not a security mechanism.

18. Backend APIs independently enforce permissions.

19. Routes must correspond to actual application functionality.

20. Menu Management does not create application routes.

21. Menu Management does not create permissions automatically.

22. Permissions are managed separately by Super Admin.

23. Default menus are populated through a database seeder.

24. MenuSeeder must be idempotent.

25. Do not create a duplicate menu or permission architecture.

26. Keep the UI simple and focused.

27. Do not introduce unnecessary features such as badges, metrics,
    external URLs, or complex visibility rules.

28. Use the existing Laravel + React architecture and Bootstrap 5
    conventions.

29. Preserve tenant isolation.

30. The final system must have one authoritative database-driven
    navigation structure.
