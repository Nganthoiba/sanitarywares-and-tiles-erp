# Implementation Plan: Product Specifications / Custom Attributes UX & Unit System Refinement

This implementation plan details the refactoring of **Section 6 — Specifications / Custom Attributes** in the Product Entry / Add Product Wizard, database migrations, Laravel model/controller enhancements, React UX workflow, API endpoints, multi-tenant isolation, and automated tests.

---

## Technical Architectural Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ORGANIZATION REUSABLE ATTRIBUTES                                                       │
│ Table: product_attributes                                                              │
│ - id, organization_id, name, slug, type ('string'|'number'|'list'), unit_id (nullable)  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           │ (Assigned via product_attribute_values)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PRODUCT-SPECIFIC ATTRIBUTE ASSIGNMENTS                                                 │
│ Table: product_attribute_values                                                        │
│ - id, organization_id, product_variant_id, product_attribute_id, value                 │
│ - Unique constraint: [organization_id, product_variant_id, product_attribute_id]       │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TRANSACTION UOM (UNCHANGED SEPARATE SYSTEM)                                           │
│ Table: units (symbol: BOX, PCS, SLAB, SQ.FT.)                                           │
│ - Used for Purchase Unit, Sales Unit, Base Unit, Stock, Pricing                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> 1. **Optional Specifications**: Products can be saved without any attributes.
> 2. **Clear Distinction**: Attribute Units (e.g., `Thickness = 8 MM`) are distinct from Transaction UOMs (e.g., `Purchase Unit = BOX`).
> 3. **Remove vs Delete**: Removing an attribute from a product disassociates `product_attribute_values` for that product only. The global `product_attributes` definition remains available across the organization.
> 4. **No Unit Support**: `unit_id = NULL` represents "NO UNIT" explicitly.

---

## Proposed Changes

### Phase 1 & 2: Database Schema & Migrations

#### [NEW] [2026_08_15_000001_add_unit_id_to_product_attributes_table.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/migrations/2026_08_15_000001_add_unit_id_to_product_attributes_table.php)
- Add nullable foreign key `unit_id` referencing `units(id)` on `product_attributes`.
- Soft nullify on delete (`nullOnDelete()`).

---

### Phase 3: Laravel Domain Models

#### [MODIFY] [ProductAttribute.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductAttribute.php)
- Add `unit_id` to `$fillable`.
- Define `unit(): BelongsTo` relationship to `App\Domains\Master\Models\Unit`.
- Define `attributeValues(): HasMany` relationship to `ProductAttributeValue`.

#### [MODIFY] [ProductAttributeValue.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductAttributeValue.php)
- Ensure `$with` or relationship helper loads `attribute.unit` so unit details are included when returning product attribute values.

#### [MODIFY] [Unit.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Unit.php)
- Add helper method `getDimensionCategoryAttribute()` or dimension mapping helper (`LENGTH`, `AREA`, `VOLUME`, `MASS`, `COUNT`, `NONE`) based on unit symbol/type for unit selection validation and display name formatting (e.g., `Millimeter (mm)`, `Square foot (sq.ft)`).

---

### Phase 4 & 5: Controller & API Endpoints

#### [MODIFY] [ProductApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php)
- **`getFormData`**:
  - Scope all queries by `$orgId`.
  - Include `attributes`: `ProductAttribute::where('organization_id', $orgId)->with('unit')->orderBy('name')->get()`.
  - Include `units`: `Unit::where('organization_id', $orgId)->where('is_active', true)->orderBy('name')->get()`.
- **`storeAttribute`**:
  - Validate `name`, `type` (`string,text,number,list`), `unit_id` (`nullable|exists:units,id` scoped to `$orgId`).
  - Create reusable `ProductAttribute` with `unit_id` (or `null` for NO UNIT).
- **`assignProductAttribute`** (`POST /api/products/{productId}/attributes`):
  - Assign attribute & value to product, enforcing organization isolation.
- **`removeProductAttribute`** (`DELETE /api/products/{productId}/attributes/{attributeId}`):
  - Delete `ProductAttributeValue` for `$productId` & `$attributeId`, leaving `ProductAttribute` definition untouched.
- **`storeVariant` & `updateVariant`**:
  - Make `attributes` array fully optional.
  - Apply clean transactional sync for assigned attributes with organization scoping.

#### [MODIFY] [routes/api.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/routes/api.php)
- Register API routes:
  - `POST /api/product/attributes` -> `ProductApiController@storeAttribute`
  - `POST /api/products/{productId}/attributes` -> `ProductApiController@assignProductAttribute`
  - `DELETE /api/products/{productId}/attributes/{attributeId}` -> `ProductApiController@removeProductAttribute`

---

### Phase 6, 7, 8 & 9: React Frontend (ProductEntry.jsx)

#### [MODIFY] [ProductEntry.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx)
1. **Section 6 UI Redesign**:
   - Header: `6. Specifications / Custom Attributes — Optional`
   - Subtitle: `"Add product-specific specifications only when they are relevant to this product."`
   - Right Header Action: `[ + Define Attribute ]` (Opens Define Attribute Modal).
   - Section Body:
     - **Assigned Only**: Track `assignedAttributeIds` state for the product. Only render attributes that have been assigned.
     - **Empty State** (0 assigned attributes):
       Displays friendly card: `"No specifications have been added. Add specifications only if this product requires them."` with `[ + Add Existing Attribute ]` button.
     - **Assigned State**: Grid of assigned attributes. Each row/card displays Attribute Name, Type-appropriate input, formatted Unit (e.g. `Millimeter (mm)` or `NO UNIT`), and Remove button `[ × ]`.
     - **Bottom Action**: `[ + Add Existing Attribute ]` button.
2. **Modals**:
   - **Define Attribute Modal**:
     - Fields: Attribute Name *, Value Type *, Unit dropdown (includes `NO UNIT` option).
     - Submit button: `[ Define & Add ]` -> Creates definition via API, refreshes attributes, and automatically assigns it to the current product.
   - **Add Existing Attribute Modal**:
     - Displays dropdown/list of organization attribute definitions that are **NOT** yet assigned to this product.
     - Selecting an attribute assigns it to the product's active attribute state.
   - **Remove Confirmation Modal**:
     - Dialog: `Remove "[Attribute Name]" from this product? This will remove the specification from this product. It will not delete the Attribute Definition.`
     - Buttons: `[Cancel]` `[Remove]`.
     - Confirming removes the product-specific value and disassociates it.
3. **Product Detail View**:
   - Displays only assigned attributes with values and formatted units.

---

### Phase 10: Automated Tests

#### [NEW] [ProductAttributeTest.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/tests/Feature/ProductAttributeTest.php)
Implement PHPUnit feature tests covering all requirements:
1. Attribute Definition without Unit (`unit_id` null).
2. Attribute Definition with Unit (`unit_id` valid ID).
3. Product creation with 0 attributes (optional Section 6).
4. Single and multiple attribute assignments.
5. Product-specific disassociation (Removing Product A attribute leaves Product B and global definition intact).
6. Multi-tenant organization isolation (cross-organization access blocked with 403/404).
7. API validation for invalid types, units, and missing attributes.

---

## Verification Plan

### Automated Tests
- Run PHPUnit tests:
  ```bash
  php artisan test --filter=ProductAttributeTest
  php artisan test --filter=ProductMasterTest
  ```

### Manual Verification
- Test creating a Tile product with Length (MM), Width (MM), Thickness (MM), Color (NO UNIT), Finish (NO UNIT).
- Test creating a Sanitaryware product with only Color (NO UNIT) & Material (NO UNIT).
- Test creating an Accessory product with 0 specifications.
- Verify removing an attribute from a product shows confirmation and only affects that product.
- Verify "Define Attribute" modal works and adds new reusable definitions.
- Verify "Add Existing Attribute" shows only unassigned attributes.
