# Comprehensive GST Invoicing Architecture Plan

## Overview
This plan enhances the ERP's invoicing and sales domain with production-grade Indian GST capabilities. It provides a robust, extensible architecture supporting:
- **Place of Supply & Automatic Supply Classification**: Auto-detection of `INTRA_STATE` (CGST + SGST) vs `INTER_STATE` (IGST) by comparing Organization/Branch State with Place of Supply State.
- **GSTIN & Identity Snapshots**: Persistent snapshotting of `supplier_gstin`, `customer_gstin`, `place_of_supply_state`, and `gst_registration_type` on invoice headers.
- **HSN/SAC & Line-Item Tax Categories**: HSN/SAC code snapshotting and support for `TAXABLE`, `EXEMPT`, `NIL_RATED`, and `NON_GST` items.
- **Tax Calculation Modes**: Flexible `tax_exclusive` vs `tax_inclusive` item pricing.
- **Invoice Types & Regulatory Controls**: Support for `REGULAR`, `BILL_OF_SUPPLY`, `SEZ_WITH_PAYMENT`, `SEZ_WITHOUT_PAYMENT`, `DEEMED_EXPORT`, `is_reverse_charge`, and GST `round_off_amount`.
- **E-Invoice & E-Way Bill Placeholders**: IRN, Ack No, Ack Date, E-Way Bill No, and E-Way Bill Date metadata attributes.

---

## Proposed Changes

### 1. Database Migrations

#### [NEW] [2026_09_15_000002_enhance_gst_invoicing_domain.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/database/migrations/2026_09_15_000002_enhance_gst_invoicing_domain.php)
- Add GST columns to `invoices`:
  - `supplier_gstin` (string 20, nullable)
  - `customer_gstin` (string 20, nullable)
  - `place_of_supply_state` (string 100, nullable)
  - `gst_registration_type` (string 30, default `'UNREGISTERED'`)
  - `supply_type` (string 20, default `'INTRA_STATE'`)
  - `invoice_type` (string 30, default `'REGULAR'`)
  - `is_reverse_charge` (boolean, default `false`)
  - `is_tax_inclusive` (boolean, default `false`)
  - `round_off_amount` (decimal 15,4, default `0.0000`)
  - `irn` (string 100, nullable)
  - `ack_no` (string 50, nullable)
  - `ack_date` (timestamp, nullable)
  - `eway_bill_no` (string 50, nullable)
  - `eway_bill_date` (timestamp, nullable)
- Add GST columns to `invoice_items`:
  - `hsn_sac_code` (string 20, nullable)
  - `tax_category` (string 20, default `'TAXABLE'`)
  - `is_tax_inclusive` (boolean, default `false`)
- Add GST columns to `customers`:
  - `gst_registration_type` (string 30, default `'UNREGISTERED'`)
  - `state_code` (string 5, nullable)

---

### 2. Models & Enums

#### [NEW] [GSTRegistrationType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTRegistrationType.php)
- Enums: `REGISTERED_REGULAR`, `REGISTERED_COMPOSITION`, `UNREGISTERED`, `SEZ`, `OVERSEAS`.

#### [NEW] [GSTSupplyType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTSupplyType.php)
- Enums: `INTRA_STATE`, `INTER_STATE`.

#### [NEW] [GSTInvoiceType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTInvoiceType.php)
- Enums: `REGULAR`, `BILL_OF_SUPPLY`, `SEZ_WITH_PAYMENT`, `SEZ_WITHOUT_PAYMENT`, `DEEMED_EXPORT`.

#### [MODIFY] [Invoice.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Models/Invoice.php) & [InvoiceItem.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Models/InvoiceItem.php)
- Add fillable attributes and casts for all new GST fields.

#### [MODIFY] [Customer.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Customer.php)
- Add `gst_registration_type` and `state_code` attributes.

---

### 3. Business Logic Engine (`SalesService`)

#### [MODIFY] [SalesService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Services/SalesService.php)
- **Automatic Supply Type Resolution**:
  Compare Organization/Branch state (e.g., `'Manipur'`) with `place_of_supply_state` (or Customer state). If states match $\rightarrow$ `INTRA_STATE` (split into CGST & SGST), otherwise $\rightarrow$ `INTER_STATE` (IGST).
- **Tax Calculation Engine (`calculateItemTax`)**:
  - Support `tax_exclusive`:
    $$\text{Taxable Amount} = (\text{Qty} \times \text{Price}) - \text{Discount}$$
    $$\text{Tax Amount} = \text{Taxable Amount} \times \frac{\text{Tax Rate}}{100}$$
  - Support `tax_inclusive`:
    $$\text{Taxable Amount} = \frac{(\text{Qty} \times \text{Price}) - \text{Discount}}{1 + (\text{Tax Rate} / 100)}$$
    $$\text{Tax Amount} = ((\text{Qty} \times \text{Price}) - \text{Discount}) - \text{Taxable Amount}$$
  - Support `EXEMPT` / `NIL_RATED`: Tax Rate forced to $0\%$, Tax Amount = $0$.
- **HSN/SAC Code Capture**: Extract HSN/SAC from `TaxProfile` or `Product` and persist on `InvoiceItem`.
- **GST Round Off**: Compute integer rounding difference for standard invoice totals.

---

## Verification Plan

### Automated Tests
- Create [GSTInvoicingArchitectureTest.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/tests/Feature/GSTInvoicingArchitectureTest.php) to test:
  1. `test_intra_state_vs_inter_state_auto_classification`: Intra-state (Manipur $\rightarrow$ Manipur) yields CGST+SGST, Inter-state (Manipur $\rightarrow$ Assam) yields IGST.
  2. `test_tax_inclusive_vs_tax_exclusive_calculation`: Verify exact net taxable amount calculation when price includes GST.
  3. `test_hsn_and_gstin_snapshotting`: Verify historical snapshotting of supplier/customer GSTIN and HSN/SAC codes on invoice creation.
  4. `test_exempt_and_nil_rated_items`: Verify 0% tax handling for exempt/nil-rated items.
- Run full PHPUnit suite (`./vendor/bin/phpunit`) to ensure 100% backward compatibility.
