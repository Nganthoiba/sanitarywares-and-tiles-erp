# Product Entry Monolith Decomposition Plan

ProductEntry.jsx is currently a ~1,720-line monolithic React component handling list views, filters, specifications, attribute definitions, unit conversions, inventory summaries, quick-add modals, API calls, and inline state.

This plan details decomposing `ProductEntry.jsx` into a modular architecture under `resources/js/components/ProductCatalog/`, moving API calls to a dedicated service layer, extracting custom state hooks, and cleanly separating presentation, form, detail, and modal logic while retaining backward compatibility.

## Proposed Component Architecture

```
resources/js/
├── services/
│   └── productApi.js                   [NEW] Dedicated API service for product catalog HTTP requests
└── components/
    ├── ProductCatalog/                 [NEW] Modular directory for Product Catalog domain
    │   ├── ProductCatalogPage.jsx      [NEW] Master container page for catalog navigation and state
    │   ├── ProductList.jsx             [NEW] Products catalog table and pagination bar
    │   ├── ProductFilters.jsx          [NEW] Search bar, per-page selector, and dropdown filters
    │   ├── ProductDetails.jsx          [NEW] Tabbed detail container view (Overview, Specs, Units, Pricing, Stock)
    │   ├── ProductDetailsForm.jsx      [NEW] Overview tab for product profile & metadata
    │   ├── ProductSpecifications.jsx   [NEW] Specifications tab displaying attribute key/value specs
    │   ├── ProductAttributes.jsx       [NEW] Custom attribute assignment & removal management
    │   ├── ProductInventorySummary.jsx [NEW] Stock inventory tab for Standard vs. Measured (Slab) stock
    │   ├── ProductModals/              [NEW] Quick add and attribute management modals
    │   │   ├── AddProductModal.jsx     [NEW] Wrapper for AddProductVariantModal
    │   │   ├── AddBrandModal.jsx        [NEW] Quick Add Brand modal dialog
    │   │   └── AddManufacturerModal.jsx[NEW] Quick Add Manufacturer modal dialog
    │   └── hooks/                      [NEW] Custom hooks encapsulating domain state & side effects
    │       ├── useProducts.js          [NEW] Manages products list, pagination, filters, and status toggles
    │       ├── useProductDetails.js    [NEW] Manages single product details, conversions, and stock summary
    │       └── useProductAttributes.js [NEW] Manages custom attribute assignments and definition modals
    └── product/
        └── ProductEntry.jsx            [MODIFY] Delegates directly to ProductCatalogPage for backwards compatibility
```

---

## User Review Required

> [!NOTE]
> The decomposition maintains full backward compatibility for `ProductEntry.jsx` in `app.jsx` (`/products/catalog` route). No breaking changes to existing routes or backend API endpoints will be introduced.

---

## Proposed Changes

### Service Layer

#### [NEW] [productApi.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/services/productApi.js)
- Encapsulates all `axios` requests to `/api/product/*`, `/api/brands-crud`, `/api/manufacturers-crud`.
- Attaches Bearer authentication headers from `localStorage`.
- Includes helper functions: `fetchFormData`, `fetchProducts`, `fetchProductDetail`, `fetchConversions`, `addConversion`, `deleteConversion`, `fetchInventorySummary`, `updateProductStatus`, `saveProduct`, `createBrand`, `createManufacturer`, `createAttribute`, `deleteProductAttribute`.

---

### Custom Hooks (`resources/js/components/ProductCatalog/hooks/`)

#### [NEW] [useProducts.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/hooks/useProducts.js)
- Manages state for `products`, `paginationMeta`, `currentPage`, `perPage`, `filters`, `loading`, `error`, `success`.
- Handles `loadFormData`, `loadProducts`, `toggleProductActiveStatus`, `handleFilterChange`, and pagination page changes.

#### [NEW] [useProductDetails.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/hooks/useProductDetails.js)
- Manages state for `selectedProduct`, `detailLoading`, `conversions`, `conversionForm`, `inventorySummary`.
- Handles `viewProductDetail`, `loadConversions`, `handleAddConversion`, `handleDeleteConversion`, `loadInventorySummary`.

#### [NEW] [useProductAttributes.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/hooks/useProductAttributes.js)
- Manages custom attribute modals (`showAttrModal`, `showAddExistingAttrModal`, `attrToRemove`), `assignedAttributeIds`, and `attributeForm`.
- Handles `handleAttributeSubmit`, `handleAddExistingAttributeSubmit`, and `confirmRemoveAttribute`.

---

### UI Components (`resources/js/components/ProductCatalog/`)

#### [NEW] [ProductCatalogPage.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductCatalogPage.jsx)
- Container component connecting state hooks with presentation views.
- Handles view transitions ("list", "create", "detail", "edit").
- Displays catalog header, global alerts (success/error messages), and sync actions.

#### [NEW] [ProductList.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductList.jsx)
- Renders the products catalog table with row serial numbers, badges for SKU, size calculation (`getProductSize`), inventory behavior type, active status, and action buttons.
- Renders the pagination controls footer bar.

#### [NEW] [ProductFilters.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductFilters.jsx)
- Renders per-page dropdown, live text search, category dropdown, brand dropdown, product type dropdown, and active status filter.

#### [NEW] [ProductDetails.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductDetails.jsx)
- Profile header card with back navigation and edit triggers.
- Vertical tab navigation pills (Overview, Specifications, Units & Conversions, Pricing Profiles, Stock Inventory).
- Delegates tab pane rendering to subcomponents (`ProductDetailsForm`, `ProductSpecifications`, `ProductInventorySummary`).

#### [NEW] [ProductDetailsForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductDetailsForm.jsx)
- Renders Overview tab key-value specifications grid (SKU, GTIN, Category, Brand, Manufacturer, Barcode, Inventory behavior).

#### [NEW] [ProductSpecifications.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductSpecifications.jsx)
- Renders product specification attribute table inside the details view.

#### [NEW] [ProductAttributes.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductAttributes.jsx)
- Custom specification attribute definitions and assignment components/modals.

#### [NEW] [ProductInventorySummary.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductInventorySummary.jsx)
- Stock Inventory tab rendering calculated stock levels for Standard products (Current stock, Available stock, Reserved stock) and Measured/Slab products (Current slabs count, Available area, Reserved area, Total measured area).

---

### Modals (`resources/js/components/ProductCatalog/ProductModals/`)

#### [NEW] [AddProductModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductModals/AddProductModal.jsx)
- Wraps/delegates product creation and editing modal workflow.

#### [NEW] [AddBrandModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductModals/AddBrandModal.jsx)
- Quick add brand modal dialog.

#### [NEW] [AddManufacturerModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/ProductCatalog/ProductModals/AddManufacturerModal.jsx)
- Quick add manufacturer modal dialog with legal name, trade name, GSTIN, phone, email, website, and address fields.

---

### Existing Entrypoint Delegation

#### [MODIFY] [ProductEntry.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx)
- Replaced with a simple export delegating to `ProductCatalogPage.jsx`.

---

## Verification Plan

### Automated Tests & Assets Compilation
1. Run Vite build to ensure all newly created modules compile without any syntax or bundling errors:
   `npm run build`
2. Run backend inventory & sales test suites to verify system integrity:
   `./vendor/bin/phpunit tests/Feature/InventoryReservationAndLowStockTest.php tests/Feature/ReservationLifecycleTest.php tests/Feature/SalesDirectBillingTest.php tests/Feature/UnitDimensionServiceTest.php`

### Manual Verification
1. Navigate to `/products/catalog` in the browser.
2. Test filtering by Search, Category, Brand, Product Type, and Status.
3. Test pagination controls and changing records per page.
4. Click **View Product Details** for standard and measured products; test all 5 detail tabs (Overview, Specifications, Units & Conversions, Pricing Profiles, Stock Inventory).
5. Add and delete unit conversion relations in the detail view.
6. Test **Add New Product Variant** and **Edit Product**.
7. Test Quick Add Brand and Quick Add Manufacturer modals.
