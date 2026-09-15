# Implementation Plan: Organization Context Integrity & Multi-Tenant Data Classification

## Overview
This plan addresses 3 core multi-tenant SaaS ERP security and architecture requirements:
1. **Remove Silent Organization Defaults (`?? 1`)**: Eliminate all silent fallbacks to `organization_id = 1` across Reporting queries/services, Inventory services, and API controllers. Require explicit `organization_id` or throw `InvalidArgumentException` when missing.
2. **Strict Tenant Scope Fallback (DENY on Missing Context)**: Refactor `OrganizationScope` so that contextless queries on tenant-owned models fail closed (`DENY` / `$builder->whereRaw('1 = 0')`) rather than returning unfiltered cross-tenant data.
3. **Formal Data Classification & Architecture Document**: Establish a comprehensive data classification architecture classifying all system models/tables into `GLOBAL MASTER`, `TENANT MASTER`, `TENANT TRANSACTION`, `PLATFORM CONFIGURATION`, or `HYBRID/SPECIAL`.

---

## Data Classification Architecture

| Category | Description | Models / Tables | Scoping Behavior |
| :--- | :--- | :--- | :--- |
| **GLOBAL MASTER** | Shared reference data across all tenants. | `Unit`, `Manufacturer`, `TaxProfile`, `Permission`, `PermissionGroup`, `Menu` | Bypass tenant filtering. |
| **TENANT MASTER** | Core master registers isolated per organization. | `Product` (`product_variants`), `Brand`, `Supplier`, `Customer`, `Warehouse`, `Branch`, `StorageLocation`, `OrganizationProductPricing` | Enforce strict `organization_id = X` lock. DENY if context missing. |
| **TENANT TRANSACTION** | High-volume operational transaction ledgers and sub-ledgers. | `InventoryObject`, `InventoryMovement`, `InventoryReservation`, `InventoryTransfer`, `InventoryAdjustment`, `InventoryCount`, `InventoryAllocation`, `GraniteSlabDetail`, `Quotation`, `SalesOrder`, `Invoice`, `Dispatch`, `SalesReturn`, `PurchaseRequisition`, `PurchaseOrder`, `GoodsReceiptNote`, `SupplierInvoice`, `PurchaseReturn`, `Account`, `AccountGroup`, `Journal`, `JournalEntry`, `JournalBatch`, `FinancialYear`, `BankAccount`, `BankTransaction`, `Payment`, `Receipt`, `OpeningBalance`, `ClosingEntry`, `DailyLedgerSnapshot`, `DocumentSequence` | Enforce strict `organization_id = X` lock. DENY if context missing. |
| **PLATFORM CONFIGURATION** | Core multi-tenant platform users, roles, audit trails. | `Organization`, `User`, `Role`, `ReportAuditLog` | Scoped via user profile or admin context. |
| **HYBRID / SPECIAL** | Global base system records with tenant-specific overrides. | `Category`, `ProductAttribute`, `ProductAttributeValue` | Filter `organization_id = X OR organization_id IS NULL`. |

---

## User Review Required

> [!IMPORTANT]
> **Strict Tenant Scoping Enforcement (`DENY` on missing context)**:
> Currently, `OrganizationScope` does `return;` (no filtering) when no `TenantContext`, `Auth::user()`, or `X-Organization-Id` header is set.
> Under the new rule, tenant models will execute `$builder->whereRaw('1 = 0')` when query context is completely absent.
> Automated tests and background jobs querying tenant models will need to bind `TenantContext` or pass explicit tenant parameters.

---

## Proposed Changes

### 1. Data Classification Documentation
#### [NEW] [tenant_data_classification.md](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/docs/architecture/tenant_data_classification.md)
- Formal architecture reference documenting all database tables, models, scoping rules, and tenant isolation policies.

---

### 2. Tenant Scoping (`OrganizationScope`)
#### [MODIFY] [OrganizationScope.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Scopes/OrganizationScope.php)
- Update step 5 (default fallback): when no `TenantContext`, `Auth::user()`, or `X-Organization-Id` header is found, apply `$builder->whereRaw('1 = 0')` for tenant models instead of returning unfiltered data.

---

### 3. Remove Silent Defaults (`?? 1`)

#### [MODIFY] Reporting Domain
- [SalesReportQuery.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Queries/SalesReportQuery.php): Throw `InvalidArgumentException` if `organization_id` missing.
- [InventoryReportQuery.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Queries/InventoryReportQuery.php): Throw `InvalidArgumentException` if `organization_id` missing.
- [PurchaseReportQuery.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Queries/PurchaseReportQuery.php): Throw `InvalidArgumentException` if `organization_id` missing.
- [GraniteReportQuery.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Queries/GraniteReportQuery.php): Throw `InvalidArgumentException` if `organization_id` missing.
- [SalesReportService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Services/SalesReportService.php): Require `organization_id`.
- [InventoryReportService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Services/InventoryReportService.php): Require `organization_id`.
- [PurchaseReportService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Services/PurchaseReportService.php): Require `organization_id`.
- [GraniteReportService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Services/GraniteReportService.php): Require `organization_id`.
- [AccountingReportService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Services/AccountingReportService.php): Require `organization_id`.
- [DashboardService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Services/DashboardService.php): Require `organization_id`.
- [RefreshSnapshotsJob.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Jobs/RefreshSnapshotsJob.php): Require `organization_id`.

#### [MODIFY] Inventory Domain Services
- [TransferService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/TransferService.php): Throw `InvalidArgumentException` if `organization_id` is absent.
- [ReservationService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/ReservationService.php): Require `organization_id`.
- [AdjustmentService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/AdjustmentService.php): Require `organization_id`.
- [AllocationService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/AllocationService.php): Require `organization_id`.
- [GraniteService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/GraniteService.php): Require `organization_id`.
- [InventoryCountService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/InventoryCountService.php): Require `organization_id`.
- [GRNService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Purchase/Services/GRNService.php): Remove fallback to 1.

#### [MODIFY] API Controllers
- [InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php): Require authenticated user tenant context.
- [ReportingApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Reporting/ReportingApiController.php): Require user / tenant context.

---

### 4. Tests

#### [NEW] [TenantSecurityScopeTest.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/tests/Feature/TenantSecurityScopeTest.php)
- Test that contextless queries on Tenant Master & Transaction models DENY (`0` records returned).
- Test that Global Master models (`Unit`, `TaxProfile`, `Manufacturer`) bypass tenant scoping.
- Test that queries with bound `TenantContext` or `Auth::user()` properly isolate tenant records.
- Test that missing `organization_id` in services throws `InvalidArgumentException`.

---

## Verification Plan

### Automated Tests
- Run full PHPUnit test suite:
  ```bash
  vendor/bin/phpunit --filter=TenantSecurityScopeTest
  vendor/bin/phpunit
  ```

### Manual Verification
- Execute `php test_reporting.php` to verify reporting scripts with explicit tenant context.
