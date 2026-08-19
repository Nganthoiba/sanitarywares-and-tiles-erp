# Implementation Plan - Category, Brand & Manufacturer CRUD and Quick Add

Add support for managing Categories, Brands, and Manufacturers in both the backend API and frontend React UI. This includes:
1. Dedicated CRUD APIs and routing for Categories, Brands, and Manufacturers.
2. Quick Add buttons and modals in the "Add Product Wizard" for all three fields.
3. CRUD pages for Categories, Brands, and Manufacturers integrated into the Dashboard sidebar navigation.

## Proposed Changes

---

### Backend API

#### [NEW] [CategoryApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/CategoryApiController.php)
- Handle index, store, show, update, and destroy for the `Category` model.
- Automatically slugify the category name if slug is not provided, and handle tenant-scoped uniqueness validation.
- Handle optional hierarchical parent_id mapping.
- Soft deletes and active status toggling.

#### [NEW] [BrandApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/BrandApiController.php)
- Handle index, store, show, update, and destroy for the `Brand` model.
- Automatically slugify the brand name if slug is not provided, and handle tenant-scoped uniqueness validation.
- Soft deletes and active status toggling.

#### [NEW] [ManufacturerApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/ManufacturerApiController.php)
- Handle index, store, show, update, and destroy for the `Manufacturer` model.
- Standard tenant-scoped fields validation: name, address, phone, email, website, is_active.
- Soft deletes and active status toggling.

#### [MODIFY] [api.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/routes/api.php)
- Register API resources for `categories-crud`, `brands-crud` and `manufacturers-crud` routes.

---

### Frontend UI Components

#### [NEW] [CategoryManager.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/CategoryManager.jsx)
- CRUD interface to list, create, edit, and soft-delete Product Categories.
- Supports selection of Parent Category.
- Features table list, active status badges, and inline modal form.

#### [NEW] [BrandManager.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/BrandManager.jsx)
- CRUD interface to list, create, edit, and soft-delete Brands.
- Features table list, active status badges, and inline modal form.

#### [NEW] [ManufacturerManager.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ManufacturerManager.jsx)
- CRUD interface to list, create, edit, and soft-delete Manufacturers.
- Features table list with fields like name, website, phone, active status, and inline modal form.

#### [MODIFY] [ProductEntry.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx)
- Update Category input selection in Add Product Wizard to use an input group with a "+ New Category" button.
- Update Brand input selection in Add Product Wizard to use an input group with a "+ New Brand" button.
- Update Manufacturer input selection in Add Product Wizard to use an input group with a "+ New Manufacturer" button.
- Add modals for quick creation of Categories, Brands, and Manufacturers directly inside the wizard.
- Automatically refresh the lookup selections and select the newly registered item when quick add is completed.

#### [MODIFY] [app.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/app.jsx)
- Import `CategoryManager`, `BrandManager` and `ManufacturerManager`.
- Add routes: `/products/categories`, `/products/brands`, and `/products/manufacturers`.
- Update Sidebar navigation structure under the "Products" dropdown menu to include links to Categories, Brands, and Manufacturers.

---

## Verification Plan

### Automated Tests
- Run existing integration/feature tests (`php artisan test`) to ensure everything is stable.
- Verify API response status codes and schema for the new endpoints using curl/console check.

### Manual Verification
- Launch the dev environment, check the **Products** sub-menu to verify the three new links (Categories, Brands, Manufacturers) exist and function correctly.
- Perform CRUD operations on Categories, Brands, and Manufacturers pages.
- Open the **Add Product Wizard** and test the "+ New Category", "+ New Brand", and "+ New Manufacturer" quick add buttons. Confirm the created entities show up in the wizard's dropdown selection correctly.
