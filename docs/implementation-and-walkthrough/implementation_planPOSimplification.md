# Implementation Plan - Purchase Order Simplification (Direct PO Primary Workflow)

Keep Purchase Requisition out of the active purchasing workflow as future scope and simplify the Purchase Order creation interface (`PurchaseOrderForm.jsx`) to use **Direct Purchase Order** exclusively as the primary purchasing document.

## User Review Required

> [!IMPORTANT]
> The "Select Purchase Order Origin" selection card containing the "From Approved Requisition" option will be removed from the **Raise New Purchase Order** screen. All Purchase Orders will be created directly by selecting suppliers and line items. Existing backend API endpoints and historical PR reference fields will remain intact for future extension.

## Proposed Changes

### Frontend - Purchase Order Module

#### [MODIFY] [PurchaseOrderForm.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/purchase/PurchaseOrderForm.jsx)
- **Remove Origin Selection Card**: Remove section `1. Select Purchase Order Origin` and radio buttons for Direct PO vs Approved Requisition.
- **Remove PR Handler Logic**: Remove `usePr` state, `requisitions` dropdown logic, and `handleRequisitionChange` mapping handler.
- **Renumber Form Section Cards**:
  - `1. Supplier & Order Specifications` (formerly section 2)
  - `2. Purchase Order Line Items` (formerly section 3)
  - `3. Purchase Order Financial Summary` (formerly section 4)
- **Default Payload Context**: Retain `purchase_requisition_id: ''` in state initialization to ensure backend payload compatibility.

## Verification Plan

### Automated Tests
- Execute PHPUnit backend test suite:
  ```bash
  ./vendor/bin/phpunit
  ```

### Manual Verification
- Launch browser subagent to visually inspect `http://localhost:8000/purchase-orders/new`.
- Verify that section card numbering begins directly at `1. Supplier & Order Specifications`.
- Verify adding line items, selecting suppliers/branches, entering slab measurements, and saving a Direct Purchase Order.
- Capture full-page screenshot for visual confirmation in `walkthrough.md`.
