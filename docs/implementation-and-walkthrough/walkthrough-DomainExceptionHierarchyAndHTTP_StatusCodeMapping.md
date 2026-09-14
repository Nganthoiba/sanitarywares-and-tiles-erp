# Walkthrough - Domain Exception Hierarchy & HTTP Status Code Mapping

We have introduced explicit domain exception classes for Inventory and Reservation operations and mapped them cleanly to HTTP status codes (**400 Bad Request**, **409 Conflict**, **422 Unprocessable Entity**).

## Custom Exception Hierarchy

- **[InventoryDomainException.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Exceptions/InventoryDomainException.php)**
  - Abstract base exception extending `\Exception`. Provides `getStatusCode()` and Laravel `render(Request $request)` auto-rendering capability.
- **[InsufficientStockException.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Exceptions/InsufficientStockException.php)**
  - Maps to **HTTP 400 (Bad Request)** when an inventory operation (such as stock reservation) fails due to requested quantity exceeding available stock.
- **[ReservationConflictException.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Exceptions/ReservationConflictException.php)**
  - Maps to **HTTP 409 (Conflict)** when attempting state transitions on reservations that are already cancelled, fulfilled, or in conflicting status.
- **[InvalidReservationException.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Exceptions/InvalidReservationException.php)**
  - Maps to **HTTP 422 (Unprocessable Entity)** when reservation parameter validation fails (e.g. missing product variant ID or invalid non-positive quantity).

---

## Service & Controller Updates

- **[ReservationService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/ReservationService.php)**
  - Replaced generic `\Exception` throws with `InvalidReservationException`, `InsufficientStockException`, and `ReservationConflictException`.
- **[InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php)**
  - Updated API exception handlers to catch `InventoryDomainException` and return `$e->getStatusCode()`.

---

## Verification Results

### Automated Test Output
```bash
./vendor/bin/phpunit tests/Feature/InventoryReservationAndLowStockTest.php tests/Feature/ReservationLifecycleTest.php
```
```text
PHPUnit 11.5.55 by Sebastian Bergmann and contributors.

Runtime:       PHP 8.3.6
Configuration: /home/ecourt/my_projects/sanitarywares-and-tiles-erp/phpunit.xml

........                                                            8 / 8 (100%)

Time: 00:03.113, Memory: 48.50 MB

OK (8 tests, 43 assertions)
```
