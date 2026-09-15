# Financial Year Integrated Document Numbering & Concurrency Hardening Walkthrough

## Summary of Accomplishments

### 1. Financial Year Integrated Document Numbering (`DocumentNumberService`)
- Created [DocumentSequence.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/DocumentSequence.php) and database migration `2026_09_15_000001_create_document_sequences_table.php` with unique index `(organization_id, document_type, fy_code)`.
- Implemented [DocumentNumberService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Services/DocumentNumberService.php):
  - Automatically resolves active or standard Indian Financial Years (Apr 1 to Mar 31), generating 2-digit FY short codes (e.g. `26-27`).
  - Generates Indian standard ERP document numbers in format: `{PREFIX}/{FY_CODE}/{NUMBER}` (e.g. `INV/26-27/000001`, `PO/26-27/000001`, `GRN/26-27/000001`, `SO/26-27/000001`, `RES/26-27/000001`, `DSP/26-27/000001`, `ADJ/26-27/000001`, `QTN/26-27/000001`, `RET/26-27/000001`, `RCP/26-27/000001`, `CNT/26-27/000001`, `TRF/26-27/000001`).
  - Performs pessimistic DB row locking (`lockForUpdate()`) on sequence records inside database transactions to eliminate race conditions and prevent sequence gaps or collisions.

### 2. Service Integrations across ERP Domains
Integrated `DocumentNumberService` into all document-generating ERP services:
- [SalesService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Services/SalesService.php): Standardized numbers for `INV`, `DSP`, `SO`, `QTN`, `RET`, and `RCP`.
- [ReservationService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/ReservationService.php): Standardized numbers for `RES`.
- [PurchaseOrderService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Purchase/Services/PurchaseOrderService.php): Standardized numbers for `PO`.
- [GRNService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Purchase/Services/GRNService.php): Standardized numbers for `GRN`.
- [AdjustmentService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/AdjustmentService.php): Standardized numbers for `ADJ`.
- [InventoryCountService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/InventoryCountService.php): Standardized numbers for `CNT`.
- [TransferService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/TransferService.php): Standardized numbers for `TRF`.

### 3. Concurrency Hardening in Stock Deduction
- Updated [SalesService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Services/SalesService.php) stock allocation queries (`createDirectSale` & `createDispatchFromSalesOrder`) with pessimistic locking (`lockForUpdate()`) inside transactions to guarantee atomic stock deduction without race conditions.

---

## Verification Results

### 1. Concurrency Test Suite
Executed `./vendor/bin/phpunit tests/Feature/SalesConcurrencyTest.php`:
- **Result**: `OK (1 test, 1 assertion)` - Successfully verified that competing sales requests fail gracefully with `Insufficient stock` instead of over-allocating inventory.

### 2. Two-Track Sales Workflow Test
Executed `./vendor/bin/phpunit tests/Feature/TwoTrackSalesWorkflowTest.php`:
- **Result**: `OK (2 tests, 26 assertions)` - Verified full multi-step workflow (`QTN` $\rightarrow$ `SO` $\rightarrow$ `RES` $\rightarrow$ `DSP` $\rightarrow$ `INV`) and direct counter sales with regex matching on Indian Financial Year document numbers (`^PREFIX/\d{2}-\d{2}/\d{6}$`).

### 3. Full ERP Test Suite
Executed `./vendor/bin/phpunit`:
- **Result**: `OK (198 tests, 810 assertions)` - All 198 tests passing cleanly across the entire codebase.
