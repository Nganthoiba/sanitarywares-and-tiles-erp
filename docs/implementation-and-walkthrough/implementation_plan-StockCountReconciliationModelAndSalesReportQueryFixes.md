# Implementation Plan: Stock Count Reconciliation Model & Sales Report Query Fixes

## Overview
This plan addresses two critical ERP enhancements:
1. **Stock Count Reconciliation Model**: Transition `InventoryCountService` from directly overwriting stock to an explicit reconciliation workflow: **System Qty → Physical Count → Variance → Reason → Approval → Adjustment Movement**. All stock movements upon approval will route through `AdjustmentService`, ensuring audit trails, inventory movements, and accounting postings are preserved.
2. **Sales Reporting Query Fixes & Integration Testing**: Fix broken references in `SalesReportQuery.php` (`invoices.branch_id` and legacy product family assumptions) and add automated integration tests to ensure report queries remain aligned with current database schemas.

---

## Proposed Changes

### 1. Inventory Domain (Reconciliation Model)

#### [NEW] [2026_09_15_000002_add_reason_to_inventory_count_items_table.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/database/migrations/2026_09_15_000002_add_reason_to_inventory_count_items_table.php)
- Add nullable `reason` column to `inventory_count_items` table to record item-level variance reasons.

#### [MODIFY] [InventoryCountItem.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Models/InventoryCountItem.php)
- Add `'reason'` to `$fillable` array.

#### [MODIFY] [InventoryCountService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/InventoryCountService.php)
- Update `updateCountQuantity()` to accept an optional `$reason` parameter and update `reason` on `InventoryCountItem`.
- Refactor `approveCount()`:
  - Eliminate direct `$obj->quantity = $item->counted_quantity; $obj->save()` mutations.
  - Gather all items with variance (`variance_quantity != 0` or `variance_area != 0`).
  - Create an `InventoryAdjustment` record via `AdjustmentService->initiateAdjustment()` with `adjustment_type = 'CYCLE_COUNT'` (or `POSITIVE`/`NEGATIVE`/`DAMAGE`), populating object deltas and variance reasons.
  - Approve the adjustment via `AdjustmentService->approveAdjustment()`, automatically executing inventory object adjustments, recording `InventoryMovement` ledgers, and posting GL stock adjustment entries via `PostingService`.

---

### 2. Reporting Domain (Sales Report Query & Integration)

#### [MODIFY] [SalesReportQuery.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Reporting/Queries/SalesReportQuery.php)
- In `getSalesRegister()`: replace direct `invoices.branch_id` query with a join through `sales_orders.branch_id` when `branch_id` filter is specified.
- In `getSalesByCategory()`: ensure clean joining of `invoice_items` → `invoices`, `product_variants`, and `categories`, preventing schema errors.

---

### 3. Automated Tests

#### [NEW] [InventoryCountReconciliationTest.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/tests/Feature/InventoryCountReconciliationTest.php)
- Test full stock count lifecycle:
  1. `initiateCount`: verifies system quantity snapshotting.
  2. `updateCountQuantity`: verifies physical count, variance calculations, and variance reason recording.
  3. `approveCount`: verifies that approval routes through `AdjustmentService`, generates `InventoryMovement` entries (`ADJUSTMENT`), posts journal entries, updates stock object balances, and prevents direct balance overwriting.

#### [NEW] [SalesReportIntegrationTest.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/tests/Feature/SalesReportIntegrationTest.php)
- Test `SalesReportQuery::getSalesRegister` with and without `branch_id` filter.
- Test `SalesReportQuery::getSalesByCategory` against real test database records.
- Verify `SalesReportService` execution and `ReportAuditLog` persistence.

---

## Verification Plan

### Automated Tests
- Run vendor/bin/phpunit on new and existing test suites:
  ```bash
  vendor/bin/phpunit --filter=InventoryCountReconciliationTest
  vendor/bin/phpunit --filter=SalesReportIntegrationTest
  vendor/bin/phpunit
  ```

### Manual Verification
- Run `php test_reporting.php` to verify reporting engine CLI execution.
