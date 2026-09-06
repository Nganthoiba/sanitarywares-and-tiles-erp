# Implementation Plan - Inventory Reservation and Low-Stock Warning Features

This plan details the technical changes required to add **Inventory Reservation** and **Low-Stock Warning** features to the existing Tiles & Sanitary / Building Materials ERP.

## Key Principles & Architectural Integrity
1. **No Parallel Inventory System**: Reuse existing `product_variants`, `units`, `inventory_objects`, `inventory_reservations`, `warehouses`, and `organizations`.
2. **Authoritative Stock Formula**: `Available Stock = On Hand Stock - Reserved Stock`.
3. **Physical Stock Integrity**: A reservation temporarily commits stock without reducing physical `On Hand` quantity or creating physical inventory movement deductions.
4. **Authoritative Low Stock Warning**: Warning status (`LOW_STOCK`) triggers when `Available Stock <= Low Stock Warning Level` (not merely On Hand stock). Low stock warning levels are per-product and tenant-scoped.
5. **Backend Concurrency Protection**: Race-free transactional verification at commit time using database locking (`lockForUpdate()`) to prevent overselling or over-reserving.
6. **Tenant Isolation**: Maintain strict `organization_id` scoping and RBAC authorization across all APIs and queries.

---

## User Review Required

> [!IMPORTANT]
> - **Reservation Stock Calculation**: Reservation will NOT decrease physical `On Hand` quantity in `inventory_objects`. Physical stock reduction occurs only upon dispatch (`DISPATCH` / `SALE` movement).
> - **Schema Migration**: Modifies `inventory_reservations` to include customer, warehouse, storage location, reference number, created_by, reservation_number, reservation_date, and expiry date. Adds `low_stock_warning_level` column to `product_variants`.

---

## Proposed Changes

### Database & Migrations

#### [NEW] [2026_09_06_000001_add_low_stock_warning_level_to_product_variants_table.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/database/migrations/2026_09_06_000001_add_low_stock_warning_level_to_product_variants_table.php)
- Adds `low_stock_warning_level` (decimal, 15, 4, default `0.0000`, nullable) to `product_variants` table.

#### [NEW] [2026_09_06_000002_enhance_inventory_reservations_table.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/database/migrations/2026_09_06_000002_enhance_inventory_reservations_table.php)
- Adds columns to `inventory_reservations`:
  - `reservation_number` (`string`, 50, nullable, indexed)
  - `warehouse_id` (foreignId to `warehouses`, nullable)
  - `storage_location_id` (foreignId to `storage_locations`, nullable)
  - `customer_id` (foreignId to `customers`, nullable)
  - `created_by` (foreignId to `users`, nullable)
  - `reservation_date` (`timestamp`, default now)
  - `expires_at` (`timestamp`, nullable)
  - `reference_number` (`string`, nullable)
  - `remarks` (`text`, nullable)
  - Updates default status from `PENDING` to `ACTIVE` (while supporting backward compatibility with existing `PENDING` status).

---

### Backend Models, Services & Controllers

#### [MODIFY] [Product.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/Product.php)
- Add `low_stock_warning_level` to `$fillable` and `$casts` (`decimal:4`).

#### [MODIFY] [InventoryReservation.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Models/InventoryReservation.php)
- Add fillable fields: `reservation_number`, `warehouse_id`, `storage_location_id`, `customer_id`, `created_by`, `reservation_date`, `expires_at`, `reference_number`, `remarks`.
- Define Eloquent relationships: `warehouse()`, `storageLocation()`, `customer()`, `creator()`.

#### [MODIFY] [ReservationService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/ReservationService.php)
- Rewrite `reserve(array $data)`:
  - Perform backend availability check inside `DB::transaction()`:
    - Lock relevant `product_variants` and `inventory_objects` rows (`lockForUpdate()`).
    - Calculate total On Hand stock and active Reserved stock for the specified product (and warehouse/location if specified).
    - Determine `available_quantity = total_on_hand - total_reserved`.
    - If `$requested_quantity > $available_quantity`, throw Exception e.g., `"Cannot reserve {$requested_quantity} {$unit} because only {$available_quantity} {$unit} is available."`.
  - Create `InventoryReservation` record with status `'ACTIVE'`.
  - Generate unique `reservation_number` (e.g. `RES-2026-00001`).
  - Do NOT reduce physical `on_hand` quantity of `inventory_objects`.
- Update `release(int $reservationId)`:
  - Mark status as `'CANCELLED'`.
  - Release reserved quantity back to available stock.
- Add `fulfill(int $reservationId)`:
  - Mark status as `'FULFILLED'`.
- Add `expireOldReservations()`:
  - Update status of active reservations past `expires_at` to `'EXPIRED'`.

#### [MODIFY] [InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php)
- Update `index(Request $request)`:
  - Calculate `on_hand_qty` from physical stock.
  - Calculate `reserved_qty` from active/pending non-expired `InventoryReservation` records.
  - Calculate `available_qty = max(0, on_hand_qty - reserved_qty)`.
  - Compute stock status:
    - `OUT_OF_STOCK` if `available_qty <= 0`.
    - `LOW_STOCK` if `low_stock_warning_level > 0` and `available_qty <= low_stock_warning_level`.
    - `NORMAL` ("In Stock") otherwise.
  - Include low-stock warning level and formatted unit symbols in output payload.
  - Return updated summary cards (`total_stock`, `available_stock`, `reserved_stock`, `low_stock_count`).
- Update `getFormData(Request $request)`:
  - Include customer list (`customers`), low stock settings, and warehouse options for reservation dropdowns.
- Add endpoints:
  - `listReservations(Request $request)`: Paginated list of reservations with filters (search, status, warehouse, customer).
  - `showReservation($id)`: Get single reservation detail.
  - `fulfillReservation($id)`: Fulfill reservation.
  - `updateLowStockSettings(Request $request, $productId)`: Update product's `low_stock_warning_level`.

#### [MODIFY] [api.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/routes/api.php)
- Register API routes:
  - `GET /api/inventory/reservations` -> `InventoryApiController@listReservations`
  - `GET /api/inventory/reservations/{id}` -> `InventoryApiController@showReservation`
  - `POST /api/inventory/reserve` -> `InventoryApiController@reserve`
  - `POST /api/inventory/reservations/{id}/cancel` -> `InventoryApiController@releaseReservation`
  - `POST /api/inventory/reservations/{id}/fulfill` -> `InventoryApiController@fulfillReservation`
  - `PUT /api/product/variants/{id}/low-stock-settings` -> `InventoryApiController@updateLowStockSettings`

#### [MODIFY] [ExpireReservations.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Console/Commands/ExpireReservations.php)
- Update command to check expired reservations based on `expires_at` timestamp as well as age thresholds.

---

### React Frontend Components

#### [MODIFY] [InventoryManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/inventory/InventoryManager.jsx)
- **View Switcher**: Add `Reservations` tab alongside `Stock View` and `Stock History`.
- **Stock Summary Cards**: Update card metrics for Total Stock, Available Stock, Reserved Stock, and Low Stock.
- **Stock Table**:
  - Columns: Product | Warehouse/Location | On Hand | Reserved | Available | Status | Actions
  - Format stock naturally with unit: `120 Box`, `30 Box`, `90 Box`.
  - Visual badges: Green for Normal, Yellow/Warning badge for Low Stock ("Low Stock"), Red badge for Out of Stock ("Out of Stock").
  - Row action menu: "Reserve Stock", "Configure Low Stock Level", "View Details".
- **Reserve Stock Modal**:
  - Fields: Product (auto-filled if triggered from row), Warehouse (required), Storage Location (optional), Quantity (required), Unit (auto-populated), Customer (optional), Quotation/SO Reference (optional), Expiry Date (optional), Remarks (optional).
  - Real-time display of On Hand, Reserved, Available stock, and validation warning if quantity exceeds Available stock.
- **Low-Stock Setting Modal**:
  - Form allowing setting per-product `Low Stock Warning Level` with product unit display.
- **Reservations List View**:
  - Display Reservation Number, Product, Customer, Warehouse/Location, Reserved Quantity, Reservation Date, Expiry Date, Status, Reference, and Action buttons (Cancel, Fulfill, View Details).
- **Product Detail Drawer/Modal**:
  - Display SKU, Category, On Hand, Reserved, Available, Low Stock Warning Level, Warehouse Breakdown, Active Reservations list, and Recent Stock Activity.

---

## Verification Plan

### Automated Backend Tests
Run PHPUnit tests:
```bash
./vendor/bin/phpunit --filter=InventoryReservationTest
./vendor/bin/phpunit --filter=LowStockWarningTest
./vendor/bin/phpunit --filter=Inventory
```
Specific test cases to create/run in `tests/Feature/InventoryReservationAndLowStockTest.php`:
1. `test_can_create_reservation_without_reducing_physical_on_hand_stock()`
2. `test_reservation_fails_transactionally_when_requested_quantity_exceeds_available_stock()`
3. `test_concurrent_reservation_attempts_locked_properly()`
4. `test_reservation_cancellation_releases_reserved_stock_back_to_available()`
5. `test_expired_reservation_marked_and_released()`
6. `test_low_stock_warning_triggered_based_on_available_stock_not_on_hand()`
7. `test_low_stock_warning_level_is_tenant_and_product_specific()`
8. `test_tenant_isolation_prevents_cross_org_reservation_access()`

### Manual Verification & UI Validation
- Run Vite build to verify no JS compile errors: `npm run build`
- Inspect page elements and interaction flow in web browser.
