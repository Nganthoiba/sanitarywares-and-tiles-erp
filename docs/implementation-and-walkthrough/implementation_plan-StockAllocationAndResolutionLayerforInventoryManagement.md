# Implementation Plan - Stock Allocation & Resolution Layer for Inventory Management

Decouple ordinary product inventory operations (`STANDARD` inventory behavior, e.g., Tiles, Sanitaryware, Fittings) from hardcoded `inventory_object_ids`. Introduce a backend **Stock Allocation & Resolution Layer** (`StockResolverService`) that dynamically resolves product stock across available inventory records. Maintain explicit slab selection for `MEASURED_MATERIAL` (Granite and Marble Slabs).

## User Review Required

> [!IMPORTANT]
> - **Ordinary Stock (`STANDARD`)**: Users specify `product_id`, `warehouse_id`, and `quantity` for transfers and adjustments. The backend `StockResolverService` automatically resolves and allocates stock across available inventory objects using FIFO / availability rules.
> - **Slab Stock (`MEASURED_MATERIAL`)**: Users can explicitly select individual physical slabs by slab code / `inventory_object_id` for transfers and adjustments.
> - **Frontend Refactoring (`InventoryManager.jsx`)**: Removes all workaround logic (`targetStock.inventory_object_ids[0]`) and provides clean product-based transfer & adjustment forms alongside slab-picker controls.

## Proposed Changes

### Backend Domain Services & Controllers

#### [NEW] [StockResolverService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/StockResolverService.php)
- Implement `resolveStock(int $organizationId, int $productVariantId, int $warehouseId, float $requestedQuantity): array`
- Queries available `InventoryObject` records for `$productVariantId` in `$warehouseId` sorted by FIFO.
- Returns list of resolved object allocations `['object' => InventoryObject, 'quantity' => float, 'area' => float]`.
- Throws meaningful exceptions if stock is insufficient.

#### [MODIFY] [TransferService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/TransferService.php)
- Refactor `initiateTransfer(array $data)`:
  - Support both `product_variant_id` (ordinary stock resolved via `StockResolverService`) and explicit `inventory_object_id` (slab stock).
  - For ordinary stock transfers: deducts quantity from source `InventoryObject`s and creates/updates destination `InventoryObject`s at `to_warehouse_id` without locking unrelated stock.

#### [MODIFY] [AdjustmentService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/AdjustmentService.php)
- Refactor `initiateAdjustment(array $data)`:
  - Support `product_variant_id` for ordinary stock adjustments.
  - Negative adjustments (`quantity_delta < 0`): resolve stock via `StockResolverService` across available inventory objects.
  - Positive adjustments (`quantity_delta > 0`): find or create bulk `InventoryObject` for `product_variant_id` at `warehouse_id`.

#### [MODIFY] [InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php)
- Update transfer and adjustment validation rules to allow `product_variant_id` alongside optional `inventory_object_id`.
- Ensure stock summary endpoints return clean product-level aggregation with optional slab detail breakdown.

### Frontend UI Components

#### [MODIFY] [InventoryManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/inventory/InventoryManager.jsx)
- Remove `targetStock.inventory_object_ids[0]` hacks in `handleTransferSubmit` and `handleAdjustSubmit`.
- Refactor Transfer and Adjustment modals:
  - For `STANDARD` products: user selects Product and enters Quantity. The payload sends `product_variant_id` and `quantity`.
  - For `MEASURED_MATERIAL` (Slabs): UI presents slab list allowing individual slab selection (`inventory_object_id`).

## Verification Plan

### Automated Tests
- Run PHPUnit test suite: `./vendor/bin/phpunit`
- Add unit/feature tests for `StockResolverServiceTest.php`, testing partial allocation across multiple inventory objects, single object transfer, and slab transfer.

### Manual Verification
- Test Transferring ordinary tiles (e.g. 15 boxes) across warehouses and verify stock balances in both source and destination warehouses.
- Test Adjusting stock (positive and negative) for ordinary tiles without passing `inventory_object_id`.
- Test Transferring and Adjusting individual Granite slabs via slab selection.
