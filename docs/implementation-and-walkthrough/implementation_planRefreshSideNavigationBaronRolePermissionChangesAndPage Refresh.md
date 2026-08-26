# Implementation Plan - Refresh Side Navigation Bar on Role Permission Changes & Page Refresh

Ensure the side navigation bar automatically refreshes whenever any changes occur in Role Permission Management (assigning/modifying permissions to roles) and whenever the web page is refreshed.

## User Review Required

> [!IMPORTANT]
> **Key Enhancements**:
> 1. **Role Permission Management Change Trigger**: When a role is created, updated, or deleted in `RoleManagement.jsx`, custom window events (`navigation-refresh` & `role-permissions-updated`) will be dispatched. The `DashboardLayout` component will listen for these events and immediately re-fetch `/api/navigation` to update the sidebar menus in real-time.
> 2. **Web Page Refresh Synchronization**: On page reload/refresh, `App` will fetch fresh user permissions from `/api/user` and `DashboardLayout` will fetch fresh authorized navigation menus from `/api/navigation` directly from the database.
> 3. **Backend Permission Resolution Alignment**: Fix `ResolveTenantContext.php` middleware which was plucking `name` instead of `slug` from `Permission` models.

## Proposed Changes

### Backend Middleware

#### [MODIFY] [ResolveTenantContext.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Middleware/ResolveTenantContext.php)
- Fix permission slug extraction: update `pluck('name')` to `pluck('slug')` so `TenantContext` accurately holds permission slugs (`platform.permissions.manage`, `master.users.manage`, etc.).

---

### Frontend Core Application

#### [MODIFY] [app.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/app.jsx)
- In `App`:
  - Fetch `/api/user` on mount (page refresh) to update user context, active role, and permissions in React state and `localStorage`.
  - Add event listener for `role-permissions-updated` to re-fetch `/api/user` when roles/permissions are modified anywhere in the app.
- In `DashboardLayout`:
  - Enhance `fetchNavigation()` to fetch `/api/navigation` without caching issues.
  - Add event listeners for `navigation-refresh` and `role-permissions-updated` events to trigger `fetchNavigation()` immediately when role permissions or menus are changed.

---

### Role & Platform Management Components

#### [MODIFY] [RoleManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/auth/RoleManagement.jsx)
- Dispatch `role-permissions-updated` and `navigation-refresh` window events upon successful role creation, role permission update, or role deletion.

#### [MODIFY] [UserManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/auth/UserManagement.jsx)
- Dispatch `role-permissions-updated` and `navigation-refresh` window events upon updating user role assignments.

#### [MODIFY] [PermissionManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/platform/PermissionManagement.jsx)
- Dispatch `role-permissions-updated` and `navigation-refresh` window events after permission / group modifications.

#### [MODIFY] [MenuManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/platform/MenuManagement.jsx)
- Dispatch `navigation-refresh` window event after menu creation, update, reordering, or deletion.

## Verification Plan

### Manual Verification
1. **Role Permission Change Verification**:
   - Open **Role Permission Management** (`/roles`).
   - Edit a custom role or default role permissions (e.g. add or remove permission for a module/menu item).
   - Click Save. Verify that the side navigation bar immediately updates to show or hide the corresponding menu items without needing a manual page reload.
2. **Page Refresh Verification**:
   - Refresh the web page (F5 / Ctrl+R).
   - Verify that `/api/user` and `/api/navigation` are called on page load and the side navigation menus load correctly with the current permissions.
