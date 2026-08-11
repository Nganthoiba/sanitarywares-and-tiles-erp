# UOM-Aware Purchasing, Packaging, and Measured-Material Architecture

This document provides a comprehensive review, refinement, and technical specification of the multi-tenant ERP system's purchasing, packaging, and measured-material architecture.

---

## 1. Existing UOM Architecture Review
- **Catalog Tables**:
  - The `units` table (`create_units_table.php`) serves as the base catalog for all units. It contains columns for `organization_id`, `name`, `symbol` (e.g. `PCS`, `BOX`, `SQFT`, `SLAB`), `type` (e.g. `QUANTITY`, `AREA`), and `decimal_places` (for quantity representation).
  - The `unit_conversions` table (`create_unit_conversions_table.php`) stores multiplier ratios. It has columns for `organization_id`, `product_variant_id` (nullable for global conversions), `from_unit_id`, `to_unit_id`, and `multiplier`.
- **Conversion Engine**:
  - Located in `InventoryService.php` (`convertQuantity`). It searches in this order:
    1. Product-specific conversion (`from_unit_id` to `to_unit_id`).
    2. Product-specific reverse conversion (dividing by the multiplier).
    3. Global conversion (`from_unit_id` to `to_unit_id` where `product_variant_id` is null).
    4. Global reverse conversion (dividing by the multiplier).
- **Adequacy**:
  - The existing structures are highly flexible and capable of expressing any deterministic unit conversion. No second UOM or conversion table is required.

---

## 2. Existing Product/Variant Architecture Review
- **Catalog Tables**:
  - `product_variants` defines the `purchase_unit_id`, `sales_unit_id`, and `base_unit_id` foreign keys constraining the valid defaults.
  - `inventory_behavior` determines the UOM processing path (`STANDARD`, `CONVERTIBLE`, `SLAB`, `SERIAL`, `BATCH`, etc.).
- **Material Classification**:
  - **Countable/Packaged**: `STANDARD` (e.g. sanitaryware) or `CONVERTIBLE` (e.g. tiles boxed to pieces).
  - **Measured**: `SLAB` (e.g. granite/marble slabs where each item is individually measured).
- **Adequacy**:
  - The variant table provides a solid foundation. The `inventory_behavior` enum allows the system to distinguish business behaviors dynamically instead of hardcoding category checks.

---

## 3. Existing Purchase Order Architecture Review
- **Catalog Tables**:
  - `purchase_orders` and `purchase_order_items` tables.
  - `purchase_order_items` has columns `quantity` (commercial order quantity), `unit_id` (order unit), `pricing_unit_id` (pricing unit), and `estimated_pricing_quantity` (area/weight/dimension quantity).
- **Pricing Basis**:
  - The pricing basis represents the quantity to multiply the `unit_price` by to calculate the subtotal.
  - If the variant is a slab (`inventory_behavior === 'SLAB'`), the pricing basis is the estimated pricing quantity (area).
  - If the variant is normal, and order unit matches pricing unit, it is the order quantity.
  - If the variant is normal, and order unit differs from pricing unit, it uses converted quantity.

---

## 4. Existing GRN Architecture Review
- **Catalog Tables**:
  - `goods_receipt_notes`, `goods_receipt_items`, and `goods_receipt_item_slabs`.
  - `goods_receipt_items` contains columns `quantity_accepted` (received commercial units count) and `received_pricing_quantity` (received measurement unit quantity).
  - `goods_receipt_item_slabs` holds individual physical measurements (`length`, `width`, `thickness`, `finish`, `origin`, and `slab_code`).
- **Logic**:
  - For slab items, the system enforces that the slab count equals `quantity_accepted`, and computes the total area using individual measurements.

---

## 5. Existing Inventory Architecture Review
- **Catalog Tables**:
  - `inventory_objects` and `inventory_movements`.
  - `inventory_objects` represents either a bulk stock record or an individually tracked item (such as a unique slab).
- **Measured Stock Duality**:
  - For slab items, a distinct `inventory_object` is stored for each individual physical slab received.
  - The system preserves the slab identity, dimensions, and area, avoiding flattening the count of slabs into a pure float area quantity.

---

## 6. Problems Found in Current Implementation
- **Dropdown Units Loading**: The unit "Slab" (symbol: `SLAB`) was missing from database seeders, making it impossible to raise POs or log GRNs for granite/marble correctly. *(Fixed: Added database migration and updated seeders).*
- **Equal-Unit Slabs Totals Bug**: When a slab item used the same unit for order and pricing (e.g., SQFT = SQFT), the subtotal calculation defaulted to quantity instead of the area field, causing the grand total to ignore changes to the expected area. *(Fixed: Aligned frontend and backend calculation algorithms).*
- **Universal Terminology UI**: The user interface forced columns like "Expected Area / Qty" and "Pricing Unit" on ordinary items (faucets, wash basins) where they only caused confusion.

---

## 7. Recommended UOM Architecture
- **No Duplicate Systems**: Leverage the existing `units` and `unit_conversions` tables.
- **Duality Mode**:
  - **Countable**: Deterministic conversions defined in `unit_conversions` where $Q_{\text{base}} = Q_{\text{commercial}} \times \text{multiplier}$.
  - **Measured**: Non-deterministic conversions. 1 slab does not have a fixed area conversion. Instead, the area is logged dynamically per object.

---

## 8. Normal Product Purchasing Model
- **Countable Logic**:
  - Commercial quantity and pricing unit are equivalent.
  - Calculations are straightforward:
    $$\text{Subtotal} = \text{Quantity} \times \text{Unit Price}$$
  - The user enters simple values: e.g. 50 Wash Basins at ₹1,500 each, producing ₹75,000 subtotal. Unnecessary fields are completely hidden.

---

## 9. Packaging & Conversion Model
- **BOX to PCS Conversion**:
  - 1 BOX of tiles converts to 4 PCS.
  - The PO records `100 BOX` as the ordered quantity and unit. The commercial unit is never flattened or lost.
  - Behind the scenes, the system maps the base unit equivalent (`400 PCS`) for inventory tracking.
- **Supplier Permissibility**:
  - The system checks if the supplier allows "open-box" orders.
  - If open-box is forbidden, fractional box orders (e.g. 21 PCS tile $\rightarrow$ 5.25 BOX) generate warnings, prompting the user to round up to full boxes (6 BOX = 24 PCS) before proceeding.

---

## 10. Granite/Marble Measured-Material Model
- **Non-Deterministic Conversions**:
  - Never define a permanent conversion factor (e.g. 1 slab = 20 SQFT).
  - The order quantity is expressed in SLAB.
  - The price is expressed in ₹ / SQFT.
  - The monetary amount is calculated on the expected slab area (PO stage) or actual slab area (GRN stage).

---

## 11. Purchase Order Data Model
- **Fields in `purchase_order_items`**:
  - `quantity`: Physical count of ordered slabs or pieces.
  - `unit_id`: Order unit (e.g. SLAB).
  - `pricing_unit_id`: Pricing unit (e.g. SQFT).
  - `estimated_pricing_quantity`: Expected area (in SQFT) for slab items.
  - `unit_price`: Rate per pricing unit.
  - `discount_amount`: Calculated line discount.
  - `tax_rate` and `tax_amount`: Calculated tax.
  - `subtotal`: $(\text{pricingBasis} \times \text{unit\_price}) - \text{discount} + \text{tax}$.

---

## 12. GRN Data Model
- **Fields in `goods_receipt_items`**:
  - `quantity_accepted`: Slabs count accepted.
  - `received_pricing_quantity`: Aggregate area (in SQFT) accepted.
- **Fields in `goods_receipt_item_slabs`**:
  - `length`, `width`, `thickness`, `finish`, `origin`, and `slab_code` for each individual slab object.

---

## 13. Inventory Data Model
- **Fields in `inventory_objects`**:
  - `product_variant_id`: References the slab product.
  - `warehouse_id` / `storage_location_id`: Stock location.
  - `quantity`: Always 1 (representing a single physical slab object).
  - `area`: The physical area of this specific slab in square feet.
  - `object_code`: Unique code (e.g., QR/Barcode or printed serial number).

---

## 14. Pricing Calculation Model
- **Authoritative Source**: The backend is the single source of truth. All subtotals, taxes, and grand totals are validated on submission.
- **Formulas**:
  - Normal products:
    $$\text{Subtotal} = (\text{Quantity} \times \text{Unit Price}) - \text{Discount}$$
  - Slab products:
    $$\text{Subtotal} = (\text{Expected Area} \times \text{Unit Price}) - \text{Discount}$$

---

## 15. PO UI/UX Design
- **Ordinary/Countable Products Grid**:
  - Column Headers: `Product Variant`, `Quantity`, `Unit`, `Rate`, `Discount`, `Tax %`, `Amount`.
  - Hides pricing unit and expected area. The UI represents a clean standard PO line.

---

## 16. Granite/Marble UI/UX Design
- **Measured Products Grid**:
  - Displays `Expected Area / Qty` as an editable number input field.
  - If expected area is empty, displays `Pending actual measurement` in the amount column.
  - If expected area is entered, displays the estimated amount prefixed with `Estimated: ₹X`.

---

## 17. PO → GRN Flow
- **Count Preservation**:
  - A PO with `10 SLABS` tracks inbound delivery in slabs.
  - If `8 SLABS` are received, `8` is recorded under `received_quantity`, leaving `2 SLABS` outstanding.
  - Remaining balances are never converted or flattened into pure area units.

---

## 18. Partial Receipt Design
- **GRN Isolation**:
  - Slabs from GRN #1 (e.g. 4 slabs, 75.6 SQFT) and GRN #2 (e.g. 6 slabs, 118 SQFT) are stored in individual `goods_receipt_items` and `goods_receipt_item_slabs` tables.
  - Aggregate received area is tracked as 193.6 SQFT, but individual slab measurements are fully preserved.

---

## 19. Over-Receipt Design
- **RBAC Policy**:
  - Never allow over-receipt via text remarks.
  - Check user permissions for the `purchase.over_receipt.approve` capability or the role `Administrator`.
  - If not authorized, block GRN validation immediately.

---

## 20. Tax & Discount Design
- **Calculation Sequence**:
  - Line-level discount is subtracted from the subtotal.
  - Tax is calculated on the discounted subtotal.
  - Grand totals are accumulated and stored for history tracking.

---

## 21. Accounting Compatibility
- **Preparation**:
  - Save exact pricing quantities (`estimated_pricing_quantity` and `received_pricing_quantity`) in decimal columns.
  - Avoid flattening count and area so that future ledgers can calculate Purchase Price Variance (PPV) and track exact accounts payable liabilities.

---

## 22. Supplier Invoice Compatibility
- **Supplier Invoice Matching**:
  - Slabs: Invoices are matched against the actual received area (`received_pricing_quantity` in SQFT).
  - Countable: Invoices are matched against accepted quantity (`quantity_accepted`).

---

## 23. Required Database Changes
- **Applied**: Database migration `2026_08_11_020648_add_slab_unit_to_units_table.php` was created and run to add the "Slab" unit. Seeders (`DatabaseSeeder.php`, `generate_enums_seeds.php`) have been updated.

---

## 24. Required Backend Changes
- **Applied**: Refactored `PurchaseOrderService.php` to calculate pricing basis using `estimated_pricing_quantity` for `SLAB` items regardless of unit equality.

---

## 25. Required API Changes
- **APIs Refined**:
  - `/api/purchase-orders` (create/update): Enforces tenant isolation using backend context, rejecting incoming client-provided organization IDs. Enforces UOM rules on save.

---

## 26. Required React Changes
- **Applied**: Refactored `PurchaseOrderForm.jsx` to dynamically render `Expected Area / Qty` as editable for `SLAB` items and to hide/show N/A for standard countable items. Form totals update dynamically.

---

## 27. Migration/Refactoring Plan
1. Create and execute database migration (Completed).
2. Refactor frontend components for conditional Expected Area column (Completed).
3. Refactor backend domain service for pricing basis calculations (Completed).
4. Run tests and verify (Completed).

---

## 28. Automated Test Plan
- **PHPUnit Suite**: Runs `tests/Feature/PurchaseOrderFlowTest.php` and `tests/Feature/GRNFlowTest.php`. Covers box-to-pieces conversions, granite slab PO calculations, expected area estimations, and over-receipt rules.

---

## 29. Documentation Updates
- Technical documentation updated to define the core distinction between **Fixed Unit Conversions** (e.g. BOX -> PCS) and **Physical Measurements** (e.g. SLAB -> SQFT).

---

## 30. Final Architecture
- Supports standard countable items and individually measured items side-by-side. Uses dynamic forms, authoritative backend calculations, and RBAC authorization for exceptions.
