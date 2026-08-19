# Implementation Plan — Super Admin Menu Management & Dynamic Navigation

Implement a platform-level, database-driven **Menu Management** module in Laravel + React ERP. This module allows the Super Admin to dynamically configure platform-wide navigation, routes, icons, ordering, and permission links, while regular tenant users (Organization Admin / Staff) consume the resulting authorized navigation.

## Key Architectural Principles
1. **Platform-Level Administration**: Menu Management is exclusively accessible by Super Admin (protected by `platform.menus.manage`). Organization Admins and Staff are read-only consumers.
2. **Database-Driven Permissions**: All protected `PAGE` menus link directly to authoritative database records (`permissions.id`). No hardcoded or string-based permissions in config files.
3. **Hierarchy & Menu Types**: Supports `GROUP` (containers, no route/permission required) and `PAGE` (navigable endpoints). Hierarchies are established via `parent_id`. Empty parent groups automatically hide if no children are authorized.
4. **Independent Backend Security**: Hiding menus in the sidebar is purely for UI/UX. Backend API routes independently enforce permissions.
5. **No Tenant Scoping for Menus**: Menus are global platform configurations. Visibility for individual users is derived at runtime from their assigned permissions.

---

## User Review Required

> [!IMPORTANT]
> - **Schema Additive Migration**: We will create an additive migration `2026_08_19_000001_update_menus_table_for_menu_types.php` to add `menu_type` (`GROUP`/`PAGE`), make `route_uri` nullable for groups, and drop the deprecated `group_name` column.
> - **Permission Scope**: Menu management endpoints under `/api/platform/menus` will be explicitly guarded by `permission:platform.menus.manage` (assigned only to Super Admin).
> - **Parent Deletion Strategy**: To prevent orphaned submenus, attempting to delete a `GROUP` menu that contains children will be rejected with an error until children are deleted or reassigned.

---

## Proposed Changes

### Database & Models

#### [NEW] `database/migrations/2026_08_19_000001_update_menus_table_for_menu_types.php`
- Add `menu_type` column (`enum(['GROUP', 'PAGE'])`, default `'PAGE'`).
- Make `route_uri` nullable.
- Remove deprecated `group_name` column.

#### [MODIFY] [Menu.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Security/Models/Menu.php)
- Add `menu_type` to `$fillable`.
- Ensure proper relationships: `parent()`, `children()`, `permission()`.
- Add scopes for `enabled()`, `ordered()`, `groups()`, `pages()`.

---

### Backend API Controllers & Routes

#### [MODIFY] [PlatformMenuController.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Platform/PlatformMenuController.php)
- `index()`: Return hierarchical tree and flat list of all menus (with `permission` and `parent` eager-loaded).
- `store()` / `update()`: Validate fields (`menu_name`, `menu_type`, `route_uri`, `parent_id`, `permission_id`, `order`, `enabled`).
  - Enforce `route_uri` required for `PAGE` menus.
  - Reject self-parenting (`parent_id == id`).
  - Enforce circular hierarchy check (preventing cycles like A → B → C → A).
- `destroy()`: Check for children before deleting a `GROUP` menu.
- `reorder()`: Batch reorder array of menu items inside a database transaction.

#### [MODIFY] [NavigationController.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Auth/NavigationController.php)
- Update `/api/navigation` response builder:
  - Super Admin gets all enabled menus.
  - Tenant users: resolve effective permissions.
  - Filter `PAGE` menus by `permission_id`.
  - Filter `GROUP` menus to only include parents with at least one authorized child.
  - Sort hierarchically by `order`.

#### [MODIFY] [routes/api.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/routes/api.php)
- Protect `/api/platform/menus*` with `permission:platform.menus.manage`.
- Add route `POST /api/platform/menus/reorder`.

---

### Seeders

#### [MODIFY] [MenuSeeder.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/database/seeders/MenuSeeder.php)
- Refactor default menu seeding to populate `GROUP` and `PAGE` records linked via `parent_id` and database `permission_id`.
- Ensure idempotency via `updateOrCreate()`.

---

### Frontend (React UI & Navigation)

#### [NEW] `resources/js/components/platform/MenuManagement.jsx`
- Implement professional 2-column Super Admin Menu Management interface:
  - **Left Panel (Navigation Tree)**: Hierarchical tree view showing `GROUP` / `PAGE` badges, icons, edit/delete buttons, and drag-and-drop / ordering controls.
  - **Right Panel (Menu Editor)**: Form with Menu Label, Menu Type selector, Icon selector, Route URI input, Parent Menu dropdown, Database Permission dropdown, Display Order input, and Enabled toggle.
- Support live drag-and-drop reordering, edit cancellation, unsaved changes warning, and child deletion warnings.

#### [MODIFY] [app.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/app.jsx)
- Add `/platform/menus` route rendering `<MenuManagement />` guarded by `hasPermission('platform.menus.manage')`.
- Update `DashboardLayout` sidebar rendering to support recursive database-driven menu hierarchy.

---

## Verification Plan

### Automated Tests
Run PHPUnit test suite covering Menu Management and dynamic navigation:
```bash
vendor/bin/phpunit tests/Feature/PlatformMenuManagementTest.php
vendor/bin/phpunit tests/Feature/SuperAdminAndDatabasePermissionsTest.php
```

Specific test cases to include:
1. **Authorization**:
   - Super Admin can access `/api/platform/menus`.
   - Organization Admin and Staff receive `403 Forbidden` on `/api/platform/menus`.
2. **CRUD Operations**:
   - Create `GROUP` menu with `route_uri = null` and `permission_id = null`.
   - Create `PAGE` menu linked to a valid database permission.
   - Update menu properties and order.
   - Prevent deleting parent `GROUP` menu when children exist.
3. **Validation**:
   - Reject `PAGE` menu without `route_uri`.
   - Reject non-existent `permission_id`.
   - Reject self-parenting and circular hierarchy (A → B → A).
4. **Navigation Tree**:
   - Super Admin receives all enabled menus.
   - Tenant user with `purchase.orders.view` receives `Purchases` -> `Purchase Orders`.
   - Tenant user without permissions receives empty navigation and parent group `Purchases` is hidden.
   - Disabled menus are excluded from `/api/navigation`.
5. **Seeder**:
   - Verify `MenuSeeder` executes idempotently without duplicate records.

### Manual Verification Scenarios
1. **Super Admin Access**: Log in as Super Admin (`smartnotification1@gmail.com`). Verify `Platform Administration` -> `Menu Manager` appears in sidebar and `/platform/menus` opens the 2-column UI.
2. **Menu Creation & Editing**: Create a new `GROUP` "Sales & Marketing", add a child `PAGE` "Customers" (`/sales/customers`, `sales.orders.manage`). Save and verify it appears in the tree and sidebar.
3. **Drag & Drop Reordering**: Drag menu items to reorder them in the left tree. Click Save/Refresh and verify order persists.
4. **Tenant User Isolation**: Log in as Organization Admin or Staff. Verify `Menu Manager` does not appear in sidebar and navigating directly to `/platform/menus` displays `Access Denied`.
5. **Dynamic Permission Visibility**: Revoke `purchase.orders.view` from a tenant user role. Verify `Purchase Orders` menu (and parent `Purchases` if empty) disappears from their sidebar.
