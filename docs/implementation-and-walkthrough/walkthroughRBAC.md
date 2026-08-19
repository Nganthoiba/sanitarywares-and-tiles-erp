# Walkthrough: Multi-Tenant Authentication, Authorization (RBAC), and Tenant Isolation System

This document summarizes the changes made to design and implement the Multi-Tenant Authentication and RBAC system.

---

## 1. Accomplished Work

### 1.1 Database Schema
*   **User Organization Mapping**: Added non-nullable `organization_id` foreign key column to the `users` table via [2026_06_29_000000_add_organization_id_to_users_table.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/migrations/2026_06_29_000000_add_organization_id_to_users_table.php).
*   **Invitation Support**: Added `invitation_token` column to the `users` table to track employee invitation links.
*   **Organization Details**: Created migration [2026_07_29_000001_add_extra_fields_to_organizations_table.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/migrations/2026_07_29_000001_add_extra_fields_to_organizations_table.php) to capture extra registration properties (e.g., country, state, city, PAN, GSTIN, settings JSON, and preferences JSON).

### 1.2 Tenancy Scopes & Context
*   **Singleton Context Holder**: Implemented [TenantContext.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Shared/Context/TenantContext.php) bound as a singleton in [AppServiceProvider.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Providers/AppServiceProvider.php) to track the active request's User, Organization, Branch, and Permissions.
*   **Secure Scope Isolation**: Refactored [OrganizationScope.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Master/Scopes/OrganizationScope.php) and [BelongsToOrganization.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Master/Traits/BelongsToOrganization.php) to resolve the active tenant from `TenantContext` or the authenticated session. This eliminates tenant spoofing vulnerabilities.
*   **Middleware Stack**:
    *   [ResolveTenantContext.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Middleware/ResolveTenantContext.php): Initializes tenant context and branch scapes on authenticated requests.
    *   [CheckPermission.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Middleware/CheckPermission.php): Enforces route permissions by verifying the user's role and permission slugs.

### 1.3 Backend Services & API
*   **Provisioning Layer**: Developed [OrganizationRegistrationService.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Security/Services/OrganizationRegistrationService.php) to orchestrate registering organizations, creating the owner account, and provisioning default resources (roles, default branch, default warehouse, and default preferences) within a single transaction.
*   **Endpoints & Routing**: Added and secured endpoints in [api.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/routes/api.php):
    *   `POST /api/register-organization` (Public Organization + Owner Registration)
    *   `POST /api/login` (Public Login with Rate Limiting and Token Provisioning)
    *   `POST /api/accept-invitation` (Public Token Invitation Activation)
    *   `GET /api/user` (Get Authenticated Context)
    *   `GET/POST/PUT/DELETE /api/users` (Admin User Administration & Invitation)

### 1.4 Frontend React Views (Simple & Elegant Light Theme)
*   [Login.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/Login.jsx): Light-themed, high-contrast login UI with input validations and logout mappings.
*   [RegisterOrganization.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/RegisterOrganization.jsx): Two-phase business registration onboarding wizard with clean layout and highly legible labels.
*   [AcceptInvitation.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/AcceptInvitation.jsx): Clear step-by-step account activation form setting passwords.
*   [UserManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/UserManagement.jsx): Team control panel to list users, delete accounts, and generate/copy onboarding invite tokens.

---

## 2. Validation & Testing

### 2.1 Backend Tests
Automated feature test suites have been implemented and executed successfully:
*   [AuthenticationTest.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/tests/Feature/AuthenticationTest.php) (logins, session checks, logouts).
*   [TenantIsolationTest.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/tests/Feature/TenantIsolationTest.php) (validates that cross-tenant queries are blocked).
*   [OrganizationRegistrationTest.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/tests/Feature/OrganizationRegistrationTest.php) (verifies automated asset provisioning).

Output from execution:
```bash
php vendor/bin/phpunit tests/Feature/AuthenticationTest.php tests/Feature/TenantIsolationTest.php tests/Feature/OrganizationRegistrationTest.php
PHPUnit 11.5.55 by Sebastian Bergmann and contributors.
Runtime:       PHP 8.3.32
Configuration: phpunit.xml
......                                                              6 / 6 (100%)
Time: 00:00.533, Memory: 44.50 MB
OK (6 tests, 42 assertions)
```

### 2.2 Frontend Build
Assets compiled without errors using Vite:
```bash
npm run build
vite v7.3.6 building client environment for production...
✓ 91 modules transformed.
public/build/assets/app-KnpJcDyc.js   405.76 kB │ gzip: 118.80 kB
✓ built in 2.36s
```
