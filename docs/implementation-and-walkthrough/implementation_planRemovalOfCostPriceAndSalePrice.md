# Implementation Plan: Remove Product-Level Pricing & Commercial Information Section

Remove fixed `cost_price` and `sale_price` from the `product_variants` table and corresponding backend/frontend structures. Pricing is batch-specific (recorded per batch upon goods receipt at the warehouse) rather than statically fixed per product variant.

## User Review Required

> [!IMPORTANT]
> - A new database migration `2026_08_27_000001_remove_cost_and_sale_price_from_product_variants_table.php` will be created to drop `cost_price` and `sale_price` columns without running `migrate:refresh`.
> - The "Commercial Information — Optional" section in `QuickProductVariantModal.jsx` and `ProductEntry.jsx` will have purchase price and sale price input fields completely removed. Tax Profile selection and active status check will be retained.

## Proposed Changes

---

### Database Migration

#### [NEW] [2026_08_27_000001_remove_cost_and_sale_price_from_product_variants_table.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/database/migrations/2026_08_27_000001_remove_cost_and_sale_price_from_product_variants_table.php)
- Create a migration to drop `cost_price` and `sale_price` columns from `product_variants` table.

---

### Product Domain Backend (Models & Services)

#### [MODIFY] [Product.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/Product.php)
- Remove `'cost_price'` and `'sale_price'` from `$fillable` and `$casts`.

#### [MODIFY] [ProductApiController.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php)
- Remove `cost_price` and `sale_price` default merges, validation rules, and payload array assignments in `storeVariant` and `updateVariant`.

#### [MODIFY] [ValuationService.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Inventory/Services/ValuationService.php)
- Remove references to `$variant->cost_price` fallback in inventory valuation calculations.

#### [MODIFY] [GRNService.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Purchase/Services/GRNService.php)
- Remove references to `$variant->cost_price` fallback in GRN item cost calculations.

---

### Seeders & Feature Tests

#### [MODIFY] [ProductSeeder.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/database/seeders/ProductSeeder.php)
- Remove `'cost_price'` and `'sale_price'` from seeder attributes.

#### [MODIFY] [ProductMasterTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/ProductMasterTest.php)
#### [MODIFY] [ProductMasterTestAdditional.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/ProductMasterTestAdditional.php)
#### [MODIFY] [ProductAttributeTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/ProductAttributeTest.php)
#### [MODIFY] [PurchaseOrderFlowTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/PurchaseOrderFlowTest.php)
#### [MODIFY] [GRNFlowTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/GRNFlowTest.php)
#### [MODIFY] [GlobalManufacturerTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/GlobalManufacturerTest.php)
- Remove `cost_price` and `sale_price` assertions and payload keys.

---

### Frontend Components

#### [MODIFY] [QuickProductVariantModal.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/components/grn/QuickProductVariantModal.jsx)
- Remove `cost_price` and `sale_price` from state.
- Remove Purchase Price and Sale Price fields from the modal UI. Keep Tax Profile selector.

#### [MODIFY] [ProductEntry.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx)
- Remove `cost_price` and `sale_price` from form state and submission handlers.
- Remove purchase and sale price inputs from Section 5.

---

## Verification Plan

### Automated Tests
- Run database migrations: `php artisan migrate`
- Run PHPUnit test suite: `./vendor/bin/phpunit tests/Feature/ProductMasterTest.php`

### Manual Verification
- Open the "Add New Product Variant" modal in GRN/Product views to confirm Purchase Price and Sale Price fields are removed.
- Create a product variant without cost/sale price fields and verify successful API response.
