# Implementation Plan - Root Parent Category Recursive Resolution

Ensure category classification helpers (`isTileCategory`, `isSlabCategory`, `isBaggedCategory`, `isSanitaryCategory`, etc.) systematically resolve and inspect the **topmost root parent category** when evaluating product/category behaviors, supporting arbitrary category hierarchy depths.

## User Review Required

> [!IMPORTANT]
> - **Hierarchical Support**: Categories can be nested at arbitrary depths (e.g. `Building Materials` → `Tiles` → `Vitrified Tiles` → `Double Charge`). All category checks will now recursively climb up to the **root parent category** (or check ancestor chain) to make classification decisions.
> - **Automatic API Payload Enrichment**: All Category API responses and Product Variant payloads with `category` will automatically include a `root_category` property (`{ id, name, slug }`) for instant frontend access.

---

## Proposed Changes

### Backend (Domain Models & API Controllers)

#### [MODIFY] [Category.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Category.php)
- Add `getRootCategory(): Category` method that recursively climbs `$this->parent` / `$this->parent_id` until reaching the root category.
- Add `root_category` accessor and append it to `$appends` array (`['root_category']`), returning `['id' => ..., 'name' => ..., 'slug' => ...]`.
- Update `isTileCategory()`, `isSlabCategory()`, `isBaggedCategory()`, `isSanitaryCategory()`, and `isAdhesiveCategory()` to evaluate against the root category's `name` and `slug` (as well as all ancestors).

#### [MODIFY] [CategoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/CategoryApiController.php)
- Update `getSpecifications($id)` to include `root_category_id`, `root_category_name`, and `root_category_slug` in the returned JSON response.
- Ensure `index` eager loads parent recursive relations where appropriate.

#### [MODIFY] [ProductApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php)
- Update `deriveCategoryBehavior()` to use `$category->isSlabCategory()` / `$category->getRootCategory()` instead of only checking `$category->parent`.

#### [MODIFY] [ProductPricingPackagingApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductPricingPackagingApiController.php)
- Ensure eager loading of `category.parent` / `root_category` so variant pricing lists contain full category hierarchy.

---

### Frontend (Shared Utilities & Components)

#### [NEW] [categoryUtils.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/utils/categoryUtils.js)
- Implement `getRootCategory(category, categoriesList)` function that recursively checks `category.root_category`, `category.parent`, or looks up `parent_id` in `categoriesList`.
- Implement `isTileCategory(category, categoriesList)`
- Implement `isSlabCategory(category, categoriesList)`
- Implement `isBaggedCategory(category, categoriesList)`
- Implement `isSanitaryCategory(category, categoriesList)`

#### [MODIFY] [ProductPricingPackagingManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductPricingPackagingManager.jsx)
- Replace local direct string checks with shared helpers from `categoryUtils.js`.

#### [MODIFY] [CategorySpecificationsForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/common/CategorySpecificationsForm.jsx)
- Update layout detection (`isTileCategory`, `isSlabCategory`) to use `root_category_slug` / `root_category_name` returned from `getSpecifications`.

#### [MODIFY] [AddProductVariantModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/common/AddProductVariantModal.jsx)
- Import and use shared `categoryUtils.js` functions for category classification.

---

## Verification Plan

### Automated Tests
- Run PHPUnit tests to verify category model and product API endpoints:
  ```bash
  ./vendor/bin/phpunit
  ```

### Manual Verification
- Test with subcategories nested multiple levels deep (e.g. `Tiles` → `Wall Tiles` → `Ceramic Wall Tiles`).
- Verify that `isTileCategory`, `isSlabCategory`, and `isBaggedCategory` correctly classify products under deep subcategories.
- Run `npm run build` to verify frontend JS compilation.
