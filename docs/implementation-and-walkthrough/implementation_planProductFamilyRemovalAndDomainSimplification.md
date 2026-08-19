# Implementation Plan - Product Family Removal & Product Domain Simplification

We are simplifying the Product domain by removing the redundant `ProductFamily` master entity and directly associating a `Product` (formerly `ProductVariant`) with a `Category` and a `Brand` (which is now mandatory).

---

## User Review Required

> [!IMPORTANT]
> - We are retaining the physical table name `product_variants` to avoid high-risk migrations on 15+ related tables (e.g. inventory, purchase, sales), but we will rename the Laravel model class `ProductVariant` to `Product` and set `protected $table = 'product_variants';` to unify domain naming.
> - The `/products/variants` and `/products/families` user-facing paths will be unified under `/products` for simpler navigation.

---

## Impact Analysis (PART 46 Requirements)

1. **Existing Product Family tables**: `product_families` table is created in `2026_06_30_000101_create_product_families_table.php` and will be dropped.
2. **Existing Product Variant tables**: `product_variants` table is created in `2026_06_30_000102_create_product_variants_table.php` and will be retained.
3. **Existing Product → Brand relationship**: A nullable foreign key `brand_id` on the `product_variants` table. This relationship will become mandatory (`NOT NULL`).
4. **Existing Family → Brand relationship**: A nullable `brand_id` on `product_families` (to be removed).
5. **Existing Variant → Family relationship**: `product_family_id` on `product_variants` (to be removed).
6. **All Product Family foreign keys**: `product_variants.product_family_id` referencing `product_families.id`.
7. **All Product Variant foreign keys**: Referenced by `inventory_objects`, `inventory_reservations`, `inventory_snapshots`, `purchase_requisition_items`, `purchase_order_items`, `goods_receipt_items`, `supplier_invoice_items`, `purchase_return_items`, `quotation_items`, `sales_order_items`, `invoice_items`, `sales_return_items`, `unit_conversions`, and `product_attribute_values`. These foreign keys will remain untouched as the physical table `product_variants` is kept.
8. **Existing Product UI**: The Product Manager currently shows family-specific tabs, filters, and info guideline guides. These will be cleaned up.
9. **Existing Add Product Wizard**: Contains a family select dropdown and a "+ New Family" button. This dropdown and modal will be removed.
10. **Existing Product APIs**: REST routes `/api/product/families` will be deleted. `/api/product/variants` endpoints will be modified to support `category_id` and `brand_id` directly.
11. **Existing Product services**: `PurchaseOrderService`, `GRNService`, and `InventoryService` reference `ProductVariant`. They will be updated to import and use the new `Product` class.
12. **Purchase dependencies**: `PurchaseRequisitionItem` and `PurchaseOrderItem` reference `product_variant_id` which now translates to a direct `Product` association.
13. **GRN dependencies**: `GoodsReceiptItem` references `product_variant_id`, pointing to `Product`.
14. **Inventory dependencies**: `InventoryObject` and `InventoryReservation` reference `product_variant_id`, pointing to `Product`.
15. **Sales dependencies**: `QuotationItem`, `SalesOrderItem`, and `InvoiceItem` reference `product_variant_id`, pointing to `Product`.
16. **Reporting dependencies**: Groupings by family (if any) will group by Category, Brand, or Product directly.
17. **Data migration requirements**: Existing database entries in `product_variants` will have their `category_id` populated from `product_families.category_id` prior to dropping the column. Null `brand_id` values will be populated with a default organization brand.
18. **Database migration plan**:
    - Write a migration to add `category_id` to `product_variants` as nullable.
    - Copy `category_id` values from `product_families` to `product_variants` based on `product_family_id`.
    - Assign default Brand to any `product_variants` with null `brand_id`.
    - Change `category_id` and `brand_id` on `product_variants` to be `NOT NULL`.
    - Drop `product_family_id` column and drop the `product_families` table.
19. **Model refactoring plan**:
    - Delete `ProductFamily.php`.
    - Rename `ProductVariant.php` to `Product.php`. Set `protected $table = 'product_variants';`.
    - Define direct `category()` and `brand()` relationships. Remove `family()`.
    - Globally rename model imports/typehints in controllers, requests, services, and tests from `ProductVariant` to `Product`.
20. **React refactoring plan**:
    - Remove Family sub-view (`view === 'families'`) and guidance guide references in `ProductEntry.jsx`.
    - Redesign Step 1 of the Wizard to render `Category *` and `Brand *` taking `col-md-6` width each, with explanatory labels and helper texts.
    - Remove `None (Auto-Resolve Default)` and `No Brand / Generic` options, enforcing required selections.
    - In `app.jsx`, update the router layout: map `/products` to the manager, remove `/products/families`, and remove the sidebar "Families" menu link.
21. **API compatibility plan**:
    - Remove endpoints for `product/families`.
    - Update `ProductApiController` `storeVariant` and `updateVariant` validations to enforce `category_id` and `brand_id`.
22. **Test plan**:
    - Update seeder files (`DatabaseSeeder.php`, `generate_enums_seeds.php`, `test_inventory.php`).
    - Adjust PHPUnit tests to create/update direct products with categories and brands.

---

## Proposed Changes

### Database Migrations

#### [NEW] [2026_08_15_050000_remove_product_families.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/migrations/2026_08_15_050000_remove_product_families.php)
- Add `category_id` to `product_variants` table.
- Copy existing category mappings from `product_families` to `product_variants`.
- Set default `brand_id` for any null items, then set both `category_id` and `brand_id` to `NOT NULL`.
- Drop `product_family_id` column and constraint from `product_variants`.
- Drop `product_families` table.

---

### Backend Models & Services

#### [DELETE] [ProductFamily.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductFamily.php)
- Remove model class definition.

#### [NEW] [Product.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/Product.php)
- Replaces `ProductVariant.php` Eloquent model class. Map `$table = 'product_variants'`.
- Define `belongsTo` relationship for Category (`category_id`) and Brand (`brand_id`).

#### [DELETE] [ProductVariant.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductVariant.php)
- Remove the old file name.

#### [MODIFY] [ProductApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php)
- Remove `storeFamily`, `updateFamily`, `deleteFamily`, and `listFamilies`.
- Update `storeVariant` (renamed to `storeProduct`) and `updateVariant` (renamed to `updateProduct`) validation rules to require `category_id` and `brand_id`. Ensure they belong to the user's organization.

#### [MODIFY] Other Controllers, Requests, and Services
- Globally update model imports and typehints from `ProductVariant` to `Product`.
- Update `DatabaseSeeder.php`, `generate_enums_seeds.php`, and `test_inventory.php` seed values.

---

### React UI Components

#### [MODIFY] [ProductEntry.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx)
- Remove `families` view, filters, toggles, and modal dialogs.
- Update Wizard Step 1: Remove Family select. Make Category and Brand selections mandatory with helpful text prompts.
- Rename UI strings from "Product Variant" to "Product".

#### [MODIFY] [app.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/app.jsx)
- Remove route `/products/families` and the corresponding sidebar sub-menu item.
- Map `/products` to the list page of `ProductEntry`.

---

## Verification Plan

### Automated Tests
- Update integration/feature tests (`ProductMasterTest.php`, `ProductMasterTestAdditional.php`, `GRNFlowTest.php`, `PurchaseOrderFlowTest.php`) to directly test `Product` model CRUD with categories and brands.
- Execute:
```bash
./vendor/bin/phpunit
```

### Manual Verification
- Verify in the browser that the "Families" tab is completely gone from the Products sidebar.
- Test the Add Product Wizard to verify that only Category, Brand, and Product Name are requested in Step 1, and that creating a product successfully persists without families.
- Verify product list and product details screens correctly display category and brand names.
