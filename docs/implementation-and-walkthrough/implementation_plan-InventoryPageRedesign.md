# Implementation Plan - Inventory Page Redesign (/inventory)

Redesign the main Inventory page (`/inventory`) for the Tiles & Sanitaryware ERP into a practical, business-oriented stock management screen for retail/wholesale shop and warehouse staff.

## User Review Required

> [!IMPORTANT]
> - **Product-Level Aggregated Stock View**: The primary Inventory list will represent aggregated stock by `(Product Variant, Warehouse, Storage Location, Batch)` rather than raw technical `InventoryObject` rows.
> - **Granite & Marble Slabs**: Slab items (`inventory_behavior === 'SLAB'`) will display as an aggregated stock summary row (e.g., `7 Slabs (52.75 sq.ft.)`). Clicking **View Details** opens a detailed physical slab list (`slab_code`, dimensions `L × W`, area `sq.ft`, location, status).
> - **No Manual "Add Stock" Button**: Inbound stock enters strictly via Goods Receipt Note (GRN) approval. Manual stock entry is not exposed.
> - **Terminology Shift**: Internal technical jargon (`Inventory Object`, `STANDARD/CONVERTIBLE`, `FIFO/LIFO/WAC`, `Specific ID`, `Cycle Audit`) is replaced with business-friendly terms (`Stock`, `Stock Count`, `Receipt`, `Sale`, `Transfer`, `Adjustment`, `In Stock`, `Low Stock`, `Out of Stock`).
> - **Preserved Backend Domain**: The underlying models (`InventoryObject`, `InventoryMovement`, `InventoryReservation`, `GraniteSlabDetail`, `InventoryCount`), database schema, tenant isolation, and GRN integration remain completely untouched and reused.

---

## Proposed Changes

### Backend (PHP / Laravel)

#### [MODIFY] [InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php)
- Update `index(Request $request)` to return:
  - `summary_cards`: `total_stock`, `available_stock`, `reserved_stock`, `low_stock`
  - `items`: aggregated stock rows grouped by `product_variant_id`, `warehouse_id`, `storage_location_id`, and `batch_number`.
  - For each item:
    - Product details (name, SKU, GTIN, barcode, category name, specifications e.g. `600 × 600 mm` or `Polished White`)
    - Warehouse & Storage Location details
    - On Hand Qty, Reserved Qty, Available Qty (`On Hand - Reserved`)
    - Area metrics (sq.ft) if applicable
    - Packaging information (e.g., `1 Box = 4 Pieces` from product pricing & packaging)
    - Stock Status badge (`In Stock`, `Low Stock`, `Out of Stock`)
    - Slabs breakdown array if product is granite/marble (`inventory_behavior === 'SLAB'`)
  - Filter support for `warehouse_id`, `category_id`, `status` (`ALL`, `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), and `search` (product name, SKU, barcode, GTIN, batch number).
- Add `getFormData(Request $request)` to return dynamic active `warehouses`, `categories`, `storage_locations`, and `product_variants` scoped to the user's organization.
- Add `getMovements(Request $request)` to return paginated stock history entries from `inventory_movements` with mapped human-friendly movement types (`Receipt`, `Sale`, `Transfer`, `Return`, `Adjustment`, `Damage`).

#### [MODIFY] [api.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/routes/api.php)
- Register `GET /api/inventory/form-data` and `GET /api/inventory/movements` endpoints under authenticated tenant middleware group.

---

### Frontend (React / JavaScript)

#### [MODIFY] [InventoryManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/inventory/InventoryManager.jsx)
- Redesign the layout and user experience:
  1. **Page Header**: Title `Inventory`, Subtitle `View and manage current stock across warehouses and storage locations.`, `[ Refresh ]` button, and `[ + Actions ▼ ]` dropdown menu.
  2. **Summary Cards**:
     - `Total Stock`
     - `Available Stock`
     - `Reserved Stock`
     - `Low Stock`
  3. **Filter Toolbar**:
     - `[ Warehouse ▼ ]` (dynamic list)
     - `[ Category ▼ ]` (dynamic list)
     - `[ Stock Status ▼ ]` (All, In Stock, Low Stock, Out of Stock)
     - `[ Search product, SKU, barcode, batch... ]`
  4. **Main Stock Table**:
     - Columns: `Product`, `Warehouse / Location`, `On Hand`, `Reserved`, `Available`, `Status`, `Actions` (`[ View Details ]`).
  5. **Stock Details Modal / Drawer**:
     - Product Info, Category, Specs, Packaging Info (`1 Box = 4 Pieces`).
     - Stock Summary (On Hand, Reserved, Available).
     - Individual Slabs breakdown table (for Granite/Marble products).
     - Recent Stock Activity table (from `inventory_movements` with clickable GRN references).
  6. **Stock History Ledger View**:
     - Secondary ledger view showing movement history (Date, Product, Movement Type, Qty/Area, Warehouse/Location, Reference, User).
  7. **Operational Actions Modals**:
     - `Transfer Stock`: Select From/To Warehouse, Product, available qty, qty to transfer, destination location, reason.
     - `Adjust Stock`: Select Warehouse, Product, preview current stock, enter adjustment delta (+/-), reason, remarks.
     - `Stock Count` (renamed from "Cycle Audit"): Select Warehouse, Product, system qty preview, counted qty input, variance calculation, reconciliation submission.

---

## Verification Plan

### Automated Tests
- Execute PHPUnit tests:
  ```bash
  ./vendor/bin/phpunit
  ```
- Execute Vite build to verify React JS bundle compilation:
  ```bash
  npm run build
  ```

### Manual Verification
- Test `/inventory` page loading in browser.
- Verify summary card numbers match aggregated database quantities.
- Filter by Warehouse, Category, Stock Status, and Search query.
- Open **View Details** modal for bulk tile/sanitaryware and verify packaging info + recent movements.
- Open **View Details** modal for Granite product and verify individual slabs breakdown table.
- Test `Transfer Stock`, `Adjust Stock`, and `Stock Count` modal workflows.
- Switch to `Stock History` ledger tab and verify movement history traceability.
