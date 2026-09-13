# Implementation Plan - Enhanced Inventory Reservation Lifecycle & Sales Integration

Enhance `InventoryReservation` schema and `ReservationService` lifecycle to support partial fulfillment and explicit stock consumption tracking (`ACTIVE` → `PARTIALLY_FULFILLED` → `FULFILLED` / `CANCELLED` / `EXPIRED`). Integrate reservation consumption with the Sales & Invoicing flow so sales dispatches deduct from reserved quantities.

## User Review Required

> [!IMPORTANT]
> - **New Columns**: `fulfilled_quantity` (decimal:4, default 0.0000) and `fulfilled_area` (decimal:4, default 0.0000) added to `inventory_reservations`.
> - **Calculated Attributes**: `remaining_quantity` (`quantity - fulfilled_quantity`) and `remaining_area`.
> - **Extended Status Lifecycle**:
>   - `ACTIVE`: Fully reserved, zero fulfilled.
>   - `PARTIALLY_FULFILLED`: Partially dispatched/consumed (`fulfilled_quantity > 0` and `< quantity`). Remaining stock continues to be reserved.
>   - `FULFILLED`: Entire reserved quantity consumed (`fulfilled_quantity >= quantity`).
>   - `CANCELLED`: Manually cancelled/released. Any remaining unfulfilled quantity is released back to available stock.
>   - `EXPIRED`: Reservation expired without fulfillment.
> - **Active Reservation Calculation**: Replaced raw `SUM(quantity)` with `SUM(quantity - fulfilled_quantity)` so partial fulfillment automatically reduces the active reservation lock on available inventory.
> - **Sales & Dispatch Integration**: When dispatches/invoices are posted in `SalesService`, any linked `reservation_id` has its `fulfilled_quantity` updated via `ReservationService::fulfill()`.

## Proposed Changes

### Database Migrations

#### [NEW] [2026_09_13_180000_add_fulfilled_quantity_to_inventory_reservations_table.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/database/migrations/2026_09_13_180000_add_fulfilled_quantity_to_inventory_reservations_table.php)
- Add `fulfilled_quantity` and `fulfilled_area` columns to `inventory_reservations`.

### Domain Models & Services

#### [MODIFY] [InventoryReservation.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Models/InventoryReservation.php)
- Add `fulfilled_quantity` and `fulfilled_area` to `$fillable` and `$casts`.
- Add accessors `getRemainingQuantityAttribute()` and `getRemainingAreaAttribute()`.
- Add `$appends = ['remaining_quantity', 'remaining_area']`.

#### [MODIFY] [ReservationService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/ReservationService.php)
- Update `reserve()` to calculate active reservations using `SUM(quantity - fulfilled_quantity)` for statuses `['ACTIVE', 'PARTIALLY_FULFILLED', 'PENDING']`.
- Update `fulfill(int $reservationId, ?float $quantityToFulfill = null, ?float $areaToFulfill = null)`:
  - Supports partial fulfillment by incrementing `fulfilled_quantity`.
  - Sets status to `PARTIALLY_FULFILLED` if `fulfilled_quantity < quantity`, or `FULFILLED` if `fulfilled_quantity >= quantity`.
- Update `release(int $reservationId)`:
  - Releases any unfulfilled remaining quantity and marks reservation `CANCELLED` (or `FULFILLED` if already partially fulfilled and user chooses to close remaining).

#### [MODIFY] [SalesService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Services/SalesService.php)
- Integrate reservation consumption when posting invoices/dispatches:
  - If a sale item references a `reservation_id`, call `ReservationService::fulfill($reservationId, $itemQty)`.

### Controllers & Frontend UI

#### [MODIFY] [InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php)
- Update `listReservations` to filter by status `PARTIALLY_FULFILLED`.
- Update `fulfillReservation` endpoint to accept optional `quantity` input for partial fulfillment.

#### [MODIFY] [InventoryManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/inventory/InventoryManager.jsx)
- Update Reservations table to display: Total Reserved, Fulfilled, Remaining Qty, and Status (`ACTIVE`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `EXPIRED`).
- Update Fulfill modal to allow entering partial quantity to fulfill.

## Verification Plan

### Automated Tests
- Run PHPUnit test suite: `./vendor/bin/phpunit`
- Add unit/feature tests in `ReservationLifecycleTest.php` covering:
  - Partial fulfillment (`ACTIVE` → `PARTIALLY_FULFILLED` → `FULFILLED`).
  - Active reservation calculation reflecting remaining unfulfilled quantity.
  - Sales dispatch fulfillment of reservations.

### Manual Verification
- Test creating a reservation of 50 boxes, fulfilling 30 boxes, verifying status becomes `PARTIALLY_FULFILLED` with 20 boxes remaining, and then fulfilling remaining 20 boxes to reach `FULFILLED`.
