# Walkthrough - Authoritative Packaging Rule & Single Source of Truth

We have refactored the Product packaging architecture to enforce **`OrganizationProductPricing`** & **`UnitConversion`** as the single authoritative source of truth for `pieces_per_box`, treating `product_variants.pieces_per_box` strictly as legacy fallback data.

## Order of Precedence for Packaging

When resolving packaging metrics (e.g. `pieces_per_box` or tile box calculations), the model now follows a single authoritative resolution chain:

1. **`organization_product_pricings.pieces_per_box`** (Current active commercial pricing/packaging contract)
2. **`unit_conversions.multiplier`** (Explicit unit conversion mapping)
3. **`product_variants.pieces_per_box`** (Legacy column fallback)

---

## Changes Made

- **[Product.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/Product.php)**
  - Added `getPiecesPerBox(): ?int` implementing the authoritative resolution chain.
  - Refactored `calculatePiecesFromBoxes()`, `calculateBoxesFromPieces()`, and `calculateAreaPerBox()` to invoke `getPiecesPerBox()`.
- **[InventoryService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/InventoryService.php)**
  - Updated unit conversion fallback logic to resolve `$variant->getPiecesPerBox()` dynamically instead of directly referencing legacy database properties.

---

## Verification Results

### Automated Test Output
```bash
./vendor/bin/phpunit tests/Feature/InventoryReservationAndLowStockTest.php tests/Feature/ReservationLifecycleTest.php tests/Feature/SalesDirectBillingTest.php
```
```text
PHPUnit 11.5.55 by Sebastian Bergmann and contributors.

Runtime:       PHP 8.3.6
Configuration: /home/ecourt/my_projects/sanitarywares-and-tiles-erp/phpunit.xml

............                                                      12 / 12 (100%)

Time: 00:03.323, Memory: 50.50 MB

OK (12 tests, 82 assertions)
```
