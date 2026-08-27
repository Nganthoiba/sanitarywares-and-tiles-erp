# Walkthrough: Product Variant Batch Pricing & Authority Permission

## Accomplished Changes

### 1. Database Table & Schema Migration
- Created migration [`2026_08_27_000003_create_product_batch_prices_table.php`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/database/migrations/2026_08_27_000003_create_product_batch_prices_table.php) defining the `product_batch_prices` table with a composite unique key on `['organization_id', 'product_variant_id', 'batch_number']`.
- Executed `php artisan migrate` successfully.

### 2. Eloquent Model & Domain Services
- Created [`ProductBatchPrice.php`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductBatchPrice.php) model with `BelongsToOrganization` trait and relationships (`productVariant`, `creator`, `updater`).
- Updated [`GRNService.php`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Purchase/Services/GRNService.php):
  - On GRN creation and draft updates, automatically creates/links a `product_batch_prices` record with `user_id` set to current authenticated user and `cost_price` and `sale_price` initially set to `NULL`.

### 3. Permission System
- Added permission `products.batch_prices.update` ("Update Batch Pricing") in [`PermissionSeeder.php`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/database/seeders/PermissionSeeder.php) under `Product Management`.
- Executed `PermissionSeeder` to populate system permission records.

### 4. API Endpoints & Controller
- Created [`ProductBatchPriceApiController.php`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductBatchPriceApiController.php):
  - `GET /api/product-batch-prices`: List batch pricing records with pagination and filters (search, variant, batch number, pricing status).
  - `PUT /api/product-batch-prices/{id}`: Update `cost_price` and `sale_price` (protected by `permission:products.batch_prices.update`).
  - `POST /api/product-batch-prices/bulk-update`: Bulk update batch prices (protected by `permission:products.batch_prices.update`).
- Registered routes in [`routes/api.php`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/routes/api.php).

### 5. Frontend UI Management
- Created React component [`ProductBatchPriceManagement.jsx`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductBatchPriceManagement.jsx):
  - Displays product variant name, SKU, unit, batch number, status badge (`Pending Price` vs `Priced`), and creator details.
  - Allows authorized users to enter and update Cost Price and Sale Price.
  - Gracefully handles read-only mode for users lacking the update permission.
- Integrated into [`ProductEntry.jsx`](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx) via a "Batch Pricing Registry" action button.

---

## Verification Results

### Frontend Asset Build
- Executed `npm run build`:
  **Result**: Assets compiled into `public/build/assets/app-eCgwvNCm.js` cleanly in 1.48s with 0 errors.
