# Multi-Tenant Data Classification Architecture

## Executive Summary
This document defines the formal data classification and tenant isolation model for the Sanitarywares and Tiles ERP application. Every database table and Eloquent model belongs to exactly one category, establishing unambiguous rules for multi-tenant data access, scoping, and security enforcement.

---

## 1. Data Classification Matrix

| Classification Category | Description | Scope Rule | Models / Tables |
| :--- | :--- | :--- | :--- |
| **GLOBAL MASTER** | System-wide reference data shared across all tenant organizations. | Bypasses `OrganizationScope`. Unfiltered for all authenticated tenant contexts. | `Unit` (`units`), `Brand` (`brands`), `Manufacturer` (`manufacturers`), `TaxProfile` (`tax_profiles`), `Permission` (`permissions`), `PermissionGroup` (`permission_groups`), `Menu` (`menus`) |
| **TENANT MASTER** | Core master registers owned exclusively by a specific organization. | Enforces strict `organization_id = X`. Absence of tenant context returns **DENY** (`1 = 0`). | `Product` (`product_variants`), `Supplier` (`suppliers`), `Customer` (`customers`), `Warehouse` (`warehouses`), `Branch` (`branches`), `StorageLocation` (`storage_locations`), `OrganizationProductPricing` (`organization_product_pricings`) |
| **TENANT TRANSACTION** | High-volume operational sub-ledgers, vouchers, documents, and movements. | Enforces strict `organization_id = X`. Absence of tenant context returns **DENY** (`1 = 0`). | `InventoryObject`, `InventoryMovement`, `InventoryReservation`, `InventoryTransfer`, `InventoryTransferItem`, `InventoryAdjustment`, `InventoryAdjustmentItem`, `InventoryCount`, `InventoryCountItem`, `InventoryAllocation`, `GraniteSlabDetail`, `Quotation`, `QuotationItem`, `SalesOrder`, `SalesOrderItem`, `Invoice`, `InvoiceItem`, `Dispatch`, `DispatchItem`, `SalesReturn`, `SalesReturnItem`, `PurchaseRequisition`, `PurchaseRequisitionItem`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceiptNote`, `GoodsReceiptItem`, `GoodsReceiptItemSlab`, `SupplierInvoice`, `SupplierInvoiceItem`, `PurchaseReturn`, `PurchaseReturnItem`, `Account`, `AccountGroup`, `Journal`, `JournalEntry`, `JournalBatch`, `FinancialYear`, `BankAccount`, `BankTransaction`, `Payment`, `Receipt`, `OpeningBalance`, `ClosingEntry`, `DailyLedgerSnapshot`, `DocumentSequence` |
| **PLATFORM CONFIGURATION** | Platform-level tenancy boundaries, user accounts, and system audit logs. | Scoped via explicit user association or Super Admin privileges. | `Organization` (`organizations`), `User` (`users`), `Role` (`roles`), `ReportAuditLog` (`report_audit_logs`) |
| **HYBRID / SPECIAL** | Base global reference entries with optional tenant-specific overrides. | Query pattern: `organization_id = X OR organization_id IS NULL`. | `Category` (`categories`), `ProductAttribute` (`product_attributes`), `ProductAttributeValue` (`product_attribute_values`) |

---

## 2. Rationale for Global Masters (`Brand` & `Manufacturer`)

- **Brand Global Scoping**: Brands (e.g., Kajaria, Somany, Kohler, Jaquar, Hindware, Cera) represent universal industry brand entities. Making `Brand` a Global Master prevents duplicate brand entity records across tenant organizations, maintains clean multi-tenant product cataloging, and simplifies global product searches and inventory reporting.
- **Manufacturer Global Scoping**: Manufacturers (e.g., Morbi Tile Industries, Kohler India) represent corporate manufacturing entities that span multiple distribution channels and multi-tenant dealerships.

---

## 3. Tenant Scoping Architecture (`OrganizationScope`)

1. **Global Master Bypass**: Models categorized under `GLOBAL MASTER` (`Unit`, `Brand`, `Manufacturer`, `TaxProfile`) bypass tenant filtering.
2. **Context Resolution Order**:
   - `TenantContext` service container binding
   - `Auth::user()` session / token state
   - `X-Organization-Id` HTTP Header
3. **Super Admin Access**: Users with `organization_id IS NULL` operate as Super Admins at platform level and bypass tenant locks.
4. **Strict Contextless Denial**: If a query is executed on a `TENANT MASTER` or `TENANT TRANSACTION` model without any active tenant context, `OrganizationScope` applies `$builder->whereRaw('1 = 0')` to deny access and prevent cross-tenant data leakage.

---

## 4. Context Requirement Rules for Domain Services & Reporting

- **No Silent Fallbacks**: Domain services and reporting query classes MUST NOT fall back to arbitrary default organization IDs (e.g., `?? 1`).
- **Explicit Context Validation**: Methods requiring tenant context must receive `$organizationId` explicitly or resolve it from authenticated session state. If missing, an `InvalidArgumentException` is thrown immediately.
