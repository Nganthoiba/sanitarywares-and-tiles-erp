# Implementation Plan: Refactor Manufacturer into a Global Independent Master

Refactor the `Manufacturer` master model so that a Manufacturer represents a **global, independent, real-world business entity** rather than an organization-scoped record. `manufacturers.organization_id` will be removed, `BelongsToOrganization` / `OrganizationScope` traits will be removed, duplicate detection logic will be added, role-based governance (Super Admin vs. Organization Admin) will be enforced, and Product-to-Manufacturer relationships will operate against the shared global master.

---

## User Review Required

> [!IMPORTANT]
> **Super Admin Account & Seeder:**
> A dedicated `SuperAdminSeeder` will be created (and called in `DatabaseSeeder`) to seed the Super Admin user:
> - **Email**: `smartnotification1@gmail.com`
> - **Password**: `password123`
> - **Role**: `Super Administrator` (`slug: super-admin`)
>
> **Role-Based Governance & Permissions:**
> 1. **Super Admin (`slug: super-admin`)**: Full CRUD access (Create, Read, Update, Delete) to global manufacturers, as well as managing verification status (`UNVERIFIED`, `VERIFIED`, `REJECTED`).
> 2. **Organization Admin**: Can **READ** global manufacturers and **CREATE** a new real-world Manufacturer record in the global master once. Organization Admins are strictly **RESTRICTED from updating or deleting** existing manufacturer records after creation, preserving canonical global master integrity.
>
> **Architectural Breaking Changes & Data Model Migration:**
> 1. `manufacturers.organization_id` will be removed. Existing manufacturer records with matching GSTINs or names across organizations will be safely merged during migration, and `product_variants.manufacturer_id` references will be re-pointed to the canonical master ID.
> 2. `Manufacturer` will no longer be tenant-scoped. Any authenticated Organization Admin can view and reference all active global manufacturers when creating Products.
> 3. Duplicate detection will prevent accidental creation of duplicate manufacturers (matching GSTIN will require using the existing manufacturer; matching names will display a possible duplicate warning).

---

## Proposed Changes

### Database & Migrations

#### [NEW] [2026_08_16_000002_refactor_manufacturers_table_to_global.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/migrations/2026_08_16_000002_refactor_manufacturers_table_to_global.php)
- Add new columns: `legal_name`, `trade_name`, `gstin`, `registration_number`, `business_constitution`, `verification_status` (default `UNVERIFIED`), `verified_at`, `created_by`, `updated_by`.
- Populate `legal_name` from existing `name` column.
- Consolidate duplicate manufacturers (matching GSTIN or normalized legal name across organizations) and update `product_variants.manufacturer_id` foreign keys to point to the canonical ID.
- Safely drop foreign key `organization_id` and remove `organization_id` column from `manufacturers` table.
- Add database indexes on `gstin`, `legal_name`, `trade_name`, and `registration_number`.

#### [NEW] [SuperAdminSeeder.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/seeders/SuperAdminSeeder.php)
- Create or update Super Admin user: `email => smartnotification1@gmail.com`, `password => Hash::make('password123')`, `name => Super Admin`.
- Assign `super-admin` role (`Super Administrator`) and set `default_role_id`.

#### [MODIFY] [DatabaseSeeder.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/seeders/DatabaseSeeder.php)
- Register `SuperAdminSeeder::class` in the seeder execution sequence.

---

### Backend (Domain Models, Controllers, Seeders)

#### [MODIFY] [Manufacturer.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Manufacturer.php)
- Remove `use BelongsToOrganization;` and `organization()` relationship.
- Remove `organization_id` from `$fillable`.
- Add `$fillable`: `['legal_name', 'trade_name', 'gstin', 'registration_number', 'business_constitution', 'address', 'phone', 'email', 'website', 'is_active', 'verification_status', 'verified_at', 'created_by', 'updated_by']`.
- Add GSTIN mutator (trims, strips internal spaces, converts to uppercase).
- Add `creator()` and `updater()` Eloquent relationships.

#### [MODIFY] [ManufacturerApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/ManufacturerApiController.php)
- Remove `organization_id` references from `index`, `store`, and `update`.
- Update `index`: Global query supporting search by `query` (legal name, trade name, GSTIN, reg number), `is_active`, `verification_status`.
- Update `store`: Accessible to both **Super Admin** (`super-admin`) and **Organization Admin**. Add duplicate detection check before creation (return 409/422 if matching GSTIN exists, or `possible_duplicates` warning if name matches, unless `force = true` is passed). Set `created_by = $request->user()->id`.
- Update `update`: **Strictly restricted to Super Admin** (`slug: super-admin`). Returns 403 Forbidden for Organization Admins attempting to edit shared global records. Set `updated_by = $request->user()->id`.
- Update `destroy`: **Strictly restricted to Super Admin** (`slug: super-admin`). Verify if `product_variants` reference the manufacturer before soft-deleting; block deletion if referenced.
- Add `checkDuplicates` action (`POST /api/manufacturers-crud/check-duplicates`).

#### [MODIFY] [ProductApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php)
- Update `getFormData()` to retrieve global active manufacturers (`Manufacturer::where('is_active', true)->orderBy('legal_name')->get()`).
- Update product creation/update validation rules to validate `manufacturer_id` against global active `manufacturers`.

#### [MODIFY] [ManufacturerSeeder.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/seeders/ManufacturerSeeder.php) & [ProductSeeder.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/seeders/ProductSeeder.php)
- Remove `organization_id` from manufacturer seeding logic.

---

### Frontend Components

#### [MODIFY] [ManufacturerManager.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ManufacturerManager.jsx)
- Update terminology to "Manufacturer Master" / "Add Manufacturer to Master".
- Role-based UI controls:
  - **Super Admin (`super-admin`)**: Displays "Add Manufacturer", "Edit", and "Delete" buttons, as well as Verification Status toggles (`VERIFIED`, `REJECTED`, `UNVERIFIED`).
  - **Organization Admin**: Displays "Add Manufacturer" button for initial creation. Hides or disables "Edit" / "Delete" actions on existing table rows with explanatory tooltip ("Only Super Admin can edit or delete shared global manufacturer records").
- Update registry table to show Legal Name, Trade Name, GSTIN, Registration Number, Verification Status (`UNVERIFIED` / `VERIFIED` / `REJECTED`), Status (`Active` / `Inactive`).
- Implement Search-First UX when adding a new manufacturer.
- Add Duplicate Detection Modal ("Existing Manufacturer Found" / "Possible Duplicate Warning") with `[Use Existing]` and `[Continue Anyway]` options.

#### [MODIFY] [ProductEntry.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx)
- Load global manufacturers for the Product Manufacturer selector dropdown.
- Update Quick Add Manufacturer modal with new fields (`legal_name`, `trade_name`, `gstin`, `registration_number`, `business_constitution`, etc.) and duplicate search.

---

## Verification Plan

### Automated Tests
Run PHPUnit test suite:
- `php artisan test --filter=GlobalManufacturerTest`
- `php artisan test --filter=ProductMasterTest`

Key scenarios to cover:
1. `test_super_admin_seeder_creates_user_with_correct_credentials_and_role`
2. `test_super_admin_has_full_crud_on_global_manufacturers`
3. `test_org_admin_can_create_manufacturer_but_cannot_update_or_delete`
4. `test_manufacturer_exists_globally_without_organization_id`
5. `test_duplicate_gstin_detection`
6. `test_organizations_can_create_products_referencing_same_global_manufacturer`
7. `test_organization_a_cannot_access_organization_b_products_when_sharing_manufacturer`

### Manual Verification
1. Run `php artisan db:seed --class=SuperAdminSeeder`.
2. Login with `smartnotification1@gmail.com` / `password123`: Verify Super Admin role is active and full CRUD on Manufacturers works.
3. Login as Organization Admin:
   - Create new Manufacturer "Kajaria Ceramics Ltd" -> Success.
   - Attempt to Edit or Delete "Kajaria Ceramics Ltd" -> Verify UI disables action and API returns 403 Forbidden.
4. Verify Organization A and Organization B can both select "Kajaria Ceramics Ltd" when creating products without cross-tenant data leakage.
