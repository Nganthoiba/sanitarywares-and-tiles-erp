# Implementation Plan - Flexible Measurement Units for Tile Dimensions

Support flexible measurement units (`mm`, `cm`, `inch`, `ft`) for tile/slab dimensions in Product Entry & Product Details while maintaining a canonical millimetre (`mm`) internal representation, accurate area calculations, and full backward compatibility.

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions:**
>
> 1. **Canonical Unit**: All physical dimensions (`length`, `width`) will be normalized internally to **millimetres (`mm`)**. Area will be calculated canonically in square metres (`m²`) and converted to square feet (`sq.ft.`).
> 2. **Display Unit Preservation**: The user's entered display unit (`cm`, `mm`, `in`, `ft`) and raw values are stored alongside canonical `mm` values so the product renders as `60 × 60 cm`, `600 × 1200 mm`, or `2 × 2 ft` as entered.
> 3. **Reuse Existing Global `units` Table**: No duplicate unit tables are added. Unit selection is dynamically restricted to units in the `units` table where `dimension_category === 'LENGTH'` (`mm`, `cm`, `in`, `ft`, `m`).
> 4. **Backward Compatibility**: Existing tile entries without an explicit unit will safely default to `ft` as legacy fallback, ensuring no existing data is corrupted.

---

## Proposed Changes

### Backend Domain Services & Helper

#### [NEW] [TileDimensionService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Product/Services/TileDimensionService.php)

- Create a dedicated domain service `TileDimensionService` for tile dimension parsing, unit conversion, normalization to millimetres, and area calculation.
- Supported units & conversion to `mm`:
    - `mm`: `1.0`
    - `cm`: `10.0`
    - `in` / `inch`: `25.4`
    - `ft` / `feet`: `304.8`
    - `m` / `meter`: `1000.0`
- Methods:
    - `normalizeToMm(float $val, string $unitSymbol): float`
    - `convertFromMm(float $mmVal, string $targetUnitSymbol): float`
    - `parsePresetSize(string $presetString): ?array` (e.g. `"60 × 60 cm"` -> `['length' => 60, 'width' => 60, 'unit' => 'cm', 'length_mm' => 600, 'width_mm' => 600]`)
    - `calculateAreaSqM(float $lengthMm, float $widthMm): float` -> `($lengthMm * $widthMm) / 1,000,000`
    - `calculateAreaSqFt(float $lengthMm, float $widthMm): float` -> `($lengthMm * $widthMm) / 92903.04`
    - `formatDisplaySize(float $length, float $width, string $unitSymbol): string`

---

### Database Seeders & Attribute Registry

#### [MODIFY] [CategorySpecificationSeeder.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/database/seeders/CategorySpecificationSeeder.php)

- Update global product attributes to include:
    - `tile-size`: Allowed values updated to include multi-unit presets `['60 × 60 cm', '30 × 60 cm', '600 × 1200 mm', '2 × 2 ft', '2 × 4 ft', '12 × 24 in', 'Custom Size']`.
    - `dimension-unit`: Attribute for dimension unit symbol (`mm`, `cm`, `in`, `ft`).
    - `length-mm`: Normalized length in millimetres.
    - `width-mm`: Normalized width in millimetres.
    - `coverage-area-sqft`: Calculated coverage area per tile/slab in Sq.Ft.
    - `coverage-area-sqm`: Calculated coverage area per tile/slab in Sq.M.

---

### Backend API Controllers & Validation

#### [MODIFY] [CategoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/CategoryApiController.php)

- Update `getSpecifications($id)` endpoint response to return available length units from global `units` table (`length_units` array with `id`, `name`, `symbol`) for easy frontend dropdown rendering.

#### [MODIFY] [ProductApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php)

- Update `storeVariant()` and `updateVariant()` to:
    - Validate custom tile dimensions: `length` (> 0), `width` (> 0), and `dimension-unit` (must exist in `units` table with length dimension category).
    - Use `TileDimensionService` to automatically compute and store normalized `length-mm`, `width-mm`, `coverage-area-sqft`, and `coverage-area-sqm` attributes.

---

### Frontend React Components

#### [MODIFY] [CategorySpecificationsForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/common/CategorySpecificationsForm.jsx)

- Update tile/slab size controls:
    - Render shared **Unit** dropdown selector next to Length and Width (`[ mm / cm / in / ft ▼ ]`), populated from available length units.
    - Preset sizes dropdown options: `60 × 60 cm`, `30 × 60 cm`, `600 × 1200 mm`, `2 × 2 ft`, `2 × 4 ft`, `12 × 24 in`, `Custom Size`.
    - Automatically parse selected preset size into length, width, and unit.
    - Show real-time calculated coverage area in both Sq.Ft. and Sq.M. based on normalized dimensions.
    - Smooth unit conversion on unit selector change when length/width values exist.

#### [MODIFY] [AddProductVariantModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/common/AddProductVariantModal.jsx)

- Ensure form data payload correctly passes dimension unit and normalized attributes during product variant creation and edit.

---

## Verification Plan

### Automated Tests

- Create dedicated feature test suite `tests/Feature/TileDimensionTest.php` covering:
    1. `60 × 60 cm` normalization to `600 × 600 mm` and `0.36 m²` (`3.88 sq.ft.`).
    2. `600 × 1200 mm` normalization to `600 × 1200 mm` and `0.72 m²` (`7.75 sq.ft.`).
    3. `2 × 2 ft` normalization to `609.6 × 609.6 mm` and `4.00 sq.ft.`.
    4. `12 × 24 in` normalization to `304.8 × 609.6 mm` and `2.00 sq.ft.`.
    5. Invalid unit validation error (422).
    6. Zero length validation error (422).
    7. Negative width validation error (422).
    8. Missing unit for custom size validation error (422).
    9. Editing existing product with reconstructed display unit.
    10. Legacy product fallback handling (defaulting missing unit to `ft`).
    11. Multi-unit physical dimension equality comparison logic.

- Command to run automated tests:
    ```bash
    ./vendor/bin/phpunit --filter=TileDimensionTest
    ./vendor/bin/phpunit
    ```

### Manual Verification

- Test creating a product with preset size `60 × 60 cm` in the UI.
- Test creating a product with custom size: Length `600`, Width `1200`, Unit `mm`.
- Test creating a product with custom size: Length `12`, Width `24`, Unit `inch`.
- Edit created products to verify display unit and values are reconstructed cleanly without unwarranted rounding or precision loss.

In the UI for Product Details 'Size' in Add New Product Variant or Edit Product Specifications, Let's change in this way, make input group for the length input and its unit input dropdown selection (ft/mm/cm...) similarly for width input with the unit input dropdown selection, similarly for thickness also but thickness attribute is not so far implemented. And when any of the unit input of either length or width is changed, it must be ensure that both must have the same unit i.e. when the length unit is changed to cm, the width unit must be automatically cm selected and vise versa.
