# Refactoring Walkthrough — Purchase Order Simplification

We have successfully simplified the Purchase Order creation workflow, redesigned the React UI with progressive disclosure, refactored backend service validations, and implemented a robust pricing conversion snapshot architecture to ensure complete historical auditability.

---

## 1. Summary of Changes

### 1.1 Database Schema
- **New Migration**: Added `pricing_conversion_factor` (decimal: `15, 6`, nullable) to the `purchase_order_items` table.
- **Data Migration**: Existing records were populated with a default conversion factor of `1.000000`.

### 1.2 Backend Domain Logic
- **`PurchaseOrderItem` Model**: Casts and fields updated to support `pricing_conversion_factor`.
- **`PurchaseOrderService`**:
  - Restructured `createPO` and `updatePO` to validate inputs authoritatively on the backend (e.g. quantity > 0, price >= 0, branch/supplier scoping).
  - Derived valid units for product variants dynamically, preventing invalid unit entries.
  - Implemented unit conversion validations for alternate pricing unit selections.
  - Snapshotted the conversion factor as `pricing_conversion_factor` on line items at the time of creation.
- **`GRNService`**:
  - Refactored `approveGRN` receiving quantity calculations to utilize the snapshotted `pricing_conversion_factor` from the corresponding PO item, protecting historical GRNs from future product variant conversion edits.

### 1.3 React Frontend UI (`PurchaseOrderForm.jsx`)
- **PR Workflow Radio Selection**: Introduced a clean, radio-toggle based flow selector: "Start New Order" or "From Approved Requisition" to prevent clutter.
- **Simplified PO Header**: Supplier, Branch, and PO Date are shown by default. Other parameters are neatly hidden inside an expandable `▸ Additional Details` section.
- **Progressive Line Item Grid**:
  - For standard products, columns are simplified to: Variant, Qty, Order Unit (limited to valid units), Price, and Amount. Alternate pricing selections show a helper hint showing converted quantities (e.g. `100 BOX = 400 PCS for pricing`).
  - For measured materials (Granite/Marble), columns switch dynamically to: Variant, Slabs Count (Qty), SLAB Unit label, Price per SQFT, Expected Area, and Estimated Amount.

---

## 2. Test Verification

We added and executed the following validation tests in `tests/Feature/PurchaseOrderFlowTest.php`:

1. **Standard PO Flow**: Standard PO creation and calculations.
2. **Tile PO priced per BOX**: Validates basic pricing.
3. **Tile PO priced per PCS**: Validates convertible pricing using variant conversion.
4. **Tile PO ordered in PCS and priced per BOX**: Validates reverse multiplier resolution.
5. **Invalid conversion rejection**: Confirm backend throws an exception when no conversion path exists between selected units.
6. **Granite measured material PO**: Slabs count and Expected Area calculations.
7. **Historical Conversion Immutability**: Confirms that if a product's conversion multiplier is updated *after* a PO is raised, receiving the PO via GRN still respects the snapshotted factor, preserving financial auditability.

All 84 unit and feature tests passed successfully:
```bash
Tests:    84 passed (284 assertions)
Duration: 3.20s
```
