# Walkthrough - Formalized Unit Dimension Architecture & Universal Conversions

We have formalized the Unit domain architecture to introduce explicit physical **Dimension Categories** and separated universal physical metric conversions from product-dependent commercial packaging conversions.

## Dimension Categories

Units are strictly organization-independent (`units` table has no `organization_id`) and are classified into distinct physical dimensions via **[UnitDimensionService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Services/UnitDimensionService.php)**:

- **`LENGTH`**: `mm`, `cm`, `m`, `in`, `ft` (Universal physical linear conversions, e.g. 1 cm = 10 mm, 1 m = 1000 mm).
- **`AREA`**: `sq.ft`, `sq.m`, `sq.cm`, `sq.mm` (Universal physical area conversions, e.g. 1 sq.m = 10.7639 sq.ft).
- **`MASS`**: `kg`, `g`, `ton`, `mt` (Universal physical mass conversions, e.g. 1 kg = 1000 g).
- **`VOLUME`**: `ml`, `l`, `cu.m`, `cu.ft` (Universal volume conversions).
- **`COUNT`**: `pcs`, `slab`, `set`, `pair` (Item count units).
- **`PACKAGING_COUNT`**: `box`, `bag`, `carton`, `bundle`, `crate`, `pallet` (Packaging count units requiring product/pricing specific packaging rules).

---

## Universal vs. Product-Dependent Conversions

1. **Universal Physical Conversions**:
   - `CM` ↔ `MM`, `SQM` ↔ `SQFT`, `KG` ↔ `G` are physical constants and convert universally without requiring product-variant records.
2. **Product-Dependent Packaging Conversions**:
   - `BOX` ↔ `PCS` or `BAG` ↔ `PCS` are product-dependent and resolve through commercial pricing (`getPiecesPerBox()`) or explicit `unit_conversions`.

---

## Changes Made

- **[UnitDimensionService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Services/UnitDimensionService.php)**
  - Created domain service defining dimension constants, dimension classification, and universal conversion multiplier lookup.
- **[Unit.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Unit.php)**
  - Integrated `UnitDimensionService` for `dimension_category` attribute. Added `isPackagingUnit()`, `isSameDimension()`, and `getUniversalMultiplierWith()`.
- **[InventoryService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/InventoryService.php)**
  - Integrated universal physical conversion step into `convertQuantity()`.
- **[UnitDimensionServiceTest.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/tests/Feature/UnitDimensionServiceTest.php)**
  - Unit test suite verifying dimension classification and universal physical multiplier resolution.

---

## Verification Results

### Automated Test Output
```bash
./vendor/bin/phpunit tests/Feature/InventoryReservationAndLowStockTest.php tests/Feature/ReservationLifecycleTest.php tests/Feature/SalesDirectBillingTest.php tests/Feature/UnitDimensionServiceTest.php
```
```text
PHPUnit 11.5.55 by Sebastian Bergmann and contributors.

Runtime:       PHP 8.3.6
Configuration: /home/ecourt/my_projects/sanitarywares-and-tiles-erp/phpunit.xml

..............                                                    14 / 14 (100%)

Time: 00:02.367, Memory: 50.50 MB

OK (14 tests, 98 assertions)
```
