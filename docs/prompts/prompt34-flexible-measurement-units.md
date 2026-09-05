Update the Product Entry / Product Details implementation to support flexible measurement units for tile dimensions.

IMPORTANT:

- First inspect the existing codebase, especially Product Entry, Product Details, product attributes, units, product variants, validation, API resources/controllers/services, migrations, and any existing size/area calculation logic.
- Reuse the existing global `units` architecture wherever possible.
- Do not introduce a second or duplicate unit system.
- Do not hard-code `ft` as the only unit for tile length and width.
- Preserve the existing product/category architecture and terminology.

==================================================

1. # BUSINESS REQUIREMENT

Tile dimensions can be provided by manufacturers using different units, for example:

60 × 60 cm
30 × 60 cm
600 × 1200 mm
2 × 2 ft
2 × 4 ft
12 × 24 inch

Therefore, the Product Entry form must allow the user to select the unit used for the tile's Length and Width.

The unit should NOT be permanently fixed to `ft`.

================================================== 2. PRODUCT ENTRY UX
==================================================

For a custom tile size, provide:

Length:
[ numeric value ]

Width:
[ numeric value ]

Unit:
[ mm ▼ ]

Prefer one shared unit selector for both Length and Width because tile dimensions normally use the same unit.

Example:

Custom Size

Length Width Unit
[ 60 ] × [ 60 ] [ cm ▼ ]

The user should be able to select supported length units such as:

- mm
- cm
- inch
- ft

Use the application's existing Unit records rather than hard-coded unit definitions if those units already exist.

================================================== 3. STANDARD TILE SIZES
==================================================

Preserve the convenient predefined-size selection.

Examples:

60 × 60 cm
30 × 60 cm
600 × 1200 mm
2 × 2 ft
2 × 4 ft

If the user selects:

Custom Size

show the numeric Length, Width and Unit controls.

Do not force users to manually enter standard sizes when a predefined size can be selected.

================================================== 4. INTERNAL NORMALIZATION
==================================================

The application must normalize dimensions to a canonical internal unit.

Use millimetres (mm) as the canonical storage unit for physical tile dimensions unless the existing domain architecture already establishes another appropriate canonical unit.

Example:

User enters:

Length = 60
Width = 60
Unit = cm

Normalize internally to:

Length = 600 mm
Width = 600 mm

Another example:

Length = 2
Width = 2
Unit = ft

Normalize internally to the equivalent millimetre values.

The purpose is to ensure that different representations of the same physical size can be compared and processed consistently.

================================================== 5. DISPLAY VALUE VS STORED VALUE
==================================================

Where appropriate, preserve the user's preferred/display unit separately from the canonical physical dimensions.

For example:

User enters:

60 × 60 cm

The system may internally store:

600 × 600 mm

but display:

60 × 60 cm

Do not unnecessarily expose the normalized values to the user.

When editing an existing product, reconstruct the displayed dimensions using the product's stored/display unit where available.

================================================== 6. AREA CALCULATION
==================================================

Area calculation must use normalized physical dimensions.

Examples:

60 × 60 cm
→ 0.36 m²

600 × 600 mm
→ 0.36 m²

2 × 2 ft
→ equivalent physical area

Do not perform area calculations using assumptions that the dimensions are always in feet.

Do not duplicate unit-conversion logic inside React.

Prefer the existing backend/domain unit-conversion mechanism if one exists.

================================================== 7. VALIDATION
==================================================

Validate:

- Length is numeric.
- Width is numeric.
- Length > 0.
- Width > 0.
- Unit is a valid supported length unit.
- Custom dimensions cannot be submitted without a unit.
- Prevent invalid/non-length units from being selected for dimensions.

Use existing backend validation as the authoritative validation.

Client-side validation may be added for better UX but must not replace server-side validation.

================================================== 8. UNIT ARCHITECTURE
==================================================

Inspect the existing `units` table/model and determine how units are currently represented.

Do not create a new table such as:

tile_dimension_units

if the existing global `units` table can represent these units.

If the existing unit model has categories/types such as:

LENGTH
AREA
WEIGHT
QUANTITY

use that mechanism to restrict the selector to length units.

The unit selector for tile dimensions should only show valid length units.

================================================== 9. PRODUCT DATA MODEL
==================================================

Inspect the current product/product_variant and product attribute implementation before changing the schema.

Determine where Length and Width are currently stored.

If the existing model stores dimension values in a way that assumes feet, modify it carefully so that dimensions can be normalized and associated with a unit.

Do not introduce redundant fields unless required.

Do not create a separate tile-specific size system if the existing Product Details/attribute architecture can support it cleanly.

================================================== 10. CATEGORY / PRODUCT DETAILS INTEGRATION
==================================================

The Product Category configuration should continue to control which Product Details appear.

For a tile category, the Product Details may include:

Size

When Size is configured as a dimensional property, the Product Entry UI should provide:

Length
Width
Unit

The organization user should not have to configure units manually every time a product is entered.

The unit selector is part of entering the product's actual dimension value.

================================================== 11. USER-FACING TERMINOLOGY
==================================================

Keep the UI simple.

Use:

Size
Length
Width
Unit

Do NOT expose technical terminology such as:

- canonical unit
- normalization
- conversion factor
- base unit
- dimension attribute definition

Those are implementation concepts, not user-facing concepts.

================================================== 12. PRODUCT DISPLAY
==================================================

After saving, display dimensions naturally according to the selected/display unit.

Examples:

60 × 60 cm

600 × 1200 mm

2 × 4 ft

12 × 24 inch

Do not display unnecessary precision.

For example, avoid:

609.600000 × 1219.200000 mm

unless the application actually needs that precision.

================================================== 13. PRODUCT COMPARISON / DUPLICATE HANDLING
==================================================

Because:

60 × 60 cm

and

600 × 600 mm

represent the same physical size, product-related comparison logic should use normalized dimensions where physical-size comparison is required.

Do not rely only on the raw entered numeric values and unit.

However, do NOT automatically merge two different product variants merely because their dimensions normalize to the same size. Product identity remains based on the existing product/business rules.

================================================== 14. PACKAGING AND PRICING
==================================================

Do not move packaging or pricing into the dimension implementation.

The existing Product Pricing & Packaging functionality remains responsible for:

- Cost Price
- Selling Price
- Pricing Basis
- Pieces per Box
- Package Weight
- Effective dates

Dimension conversion must remain independent of pricing and packaging.

================================================== 15. INVENTORY IMPACT
==================================================

Do not change inventory behavior merely because dimension units become flexible.

Inventory should continue using the existing product and unit architecture.

If area-based inventory calculations depend on dimensions, ensure they consume normalized dimensions rather than assuming feet.

Do not introduce another inventory conversion mechanism.

================================================== 16. EXISTING DATA / BACKWARD COMPATIBILITY
==================================================

Inspect existing products before changing the schema or conversion logic.

Determine whether existing tile dimensions are currently stored as feet, millimetres, centimetres, or through Product Attributes.

Do not silently reinterpret existing data.

If a migration is required, provide a safe migration strategy that preserves existing product dimensions.

If existing data already contains units, retain them.

If existing data assumes feet and no unit is stored, explicitly account for that legacy assumption during migration.

================================================== 17. API
==================================================

Update the relevant Product Entry APIs/resources if necessary.

The API should accept a structure conceptually similar to:

size:
length: 60
width: 60
unit: CM

The backend should validate the unit and normalize the dimensions.

The API response should provide enough information for the frontend to display the dimensions correctly.

Do not put authoritative conversion calculations only in the frontend.

================================================== 18. FRONTEND
==================================================

Update the existing React Product Entry components.

For custom tile size:

[ Length ] × [ Width ] [ Unit ▼ ]

Populate the unit selector dynamically from valid length units where possible.

When the user changes the unit, do not unexpectedly alter the entered physical dimensions unless the existing UX explicitly requires conversion.

For example, if the user changes:

60 × 60 cm

to:

mm

either convert the displayed values consistently to:

600 × 600 mm

or use a clear, predictable conversion behavior.

Do not create confusing or destructive unit changes.

================================================== 19. TESTING
==================================================

Add/update tests for at least:

1. 60 × 60 cm
2. 600 × 600 mm
3. 2 × 2 ft
4. 12 × 24 inch
5. Invalid unit
6. Zero length
7. Negative width
8. Missing unit
9. Area calculation after normalization
10. Editing an existing product
11. Existing legacy products
12. Same physical size represented using different units

Verify that normalized dimensions are consistent.

================================================== 20. FINAL IMPLEMENTATION GOAL
==================================================

The final Product Entry experience should be simple:

Size

Standard Size:
[ 60 × 60 cm ▼ ]

or

Custom Size:

Length
[ 60 ]

Width
[ 60 ]

Unit
[ cm ▼ ]

The system should accept:

60 × 60 cm
600 × 600 mm
2 × 2 ft
12 × 24 inch

while internally maintaining consistent physical dimensions.

================================================== 21. IMPORTANT IMPLEMENTATION RULE
==================================================

Before changing anything:

1. Inspect the existing units table/model.
2. Inspect Product Details/attributes.
3. Inspect product_variants.
4. Inspect existing tile size implementation.
5. Inspect existing area calculations.
6. Inspect inventory area calculations.
7. Inspect validation.
8. Inspect API resources/controllers/services.
9. Determine whether a database migration is actually necessary.
10. Reuse existing architecture wherever possible.

Do not blindly add new tables or fields.

Implement the smallest clean change that gives tile dimensions flexible units while maintaining consistent internal representation and preserving existing product, pricing, packaging, GRN, and inventory behavior.
