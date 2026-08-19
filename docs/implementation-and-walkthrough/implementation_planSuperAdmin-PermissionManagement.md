# Implementation Plan — Super Admin Permission Management (`/platform/permissions`)

Build a database-driven Permission & Permission Group Management module accessible to Super Admin users at `/platform/permissions`.

## User Review Required
> [!NOTE]
> The Permissions module allows Super Admins to manage system-wide operational permission definitions and their logical groupings. Changing permission slugs or disabling permissions will affect authorization across tenant roles and dynamic sidebar menus.

## Proposed Changes

### Backend Infrastructure

#### [MODIFY] [PlatformPermissionController.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Platform/PlatformPermissionController.php)
- Add `destroyGroup($id)` with safety check preventing deletion of groups containing active permissions.
- Add `destroyPermission($id)` with safety check preventing deletion of permissions attached to roles or menus.
- Ensure all responses return structured JSON with loaded group relationships.

#### [MODIFY] [routes/api.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/routes/api.php)
- Register `DELETE /api/platform/permission-groups/{id}` and `DELETE /api/platform/permissions/{id}` routes under `permission:platform.permissions.manage` middleware.

---

### Frontend UI Component & Routing

#### [NEW] [PermissionManagement.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/components/platform/PermissionManagement.jsx)
- **Metrics Header**: Overview of total permission groups, total permissions, active permissions, and disabled permissions.
- **Permission Group Manager**:
  - Tabbed or card-based view of groups.
  - "+ Add Group" modal to create new permission categories.
  - Inline edit & delete for permission groups.
- **Permission Management Table**:
  - Filter by group & text search across slug, display name, and description.
  - "+ Add Permission" modal (group selection, slug, display name, description).
  - Edit permission details modal.
  - Quick Enable/Disable toggle button.
  - Delete permission action with safety prompts.

#### [MODIFY] [app.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/app.jsx)
- Import `PermissionManagement` component.
- Register route `/platform/permissions` guarded by `platform.permissions.manage`.

---

## Verification Plan

### Automated Tests
- Run PHPUnit test suite to verify permissions controllers and middleware authorization:
  ```bash
  vendor/bin/phpunit tests/Feature/PlatformMenuManagementTest.php
  vendor/bin/phpunit tests/Feature/SuperAdminAndDatabasePermissionsTest.php
  ```

### Manual & Asset Verification
- Run `npm run build` to verify frontend compilation.
- Test CRUD operations on permission groups and individual permissions via the UI.
