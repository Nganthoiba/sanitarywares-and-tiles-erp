# Production GST Invoicing Architecture Walkthrough

## Summary of Accomplishments

### 1. Database Schema & Models Enhancement
- Created migration `2026_09_15_000002_enhance_gst_invoicing_domain.php` adding GST domain fields across tables:
  - `invoices`: `supplier_gstin`, `customer_gstin`, `place_of_supply_state`, `gst_registration_type`, `supply_type`, `invoice_type`, `is_reverse_charge`, `is_tax_inclusive`, `round_off_amount`, `irn`, `ack_no`, `ack_date`, `eway_bill_no`, `eway_bill_date`.
  - `invoice_items`: `hsn_sac_code`, `tax_category` (`TAXABLE`, `EXEMPT`, `NIL_RATED`, `NON_GST`), `is_tax_inclusive`.
  - `customers`: `gst_registration_type`, `state_code`.
- Added Enums for type safety:
  - [GSTRegistrationType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTRegistrationType.php): `REGISTERED_REGULAR`, `REGISTERED_COMPOSITION`, `UNREGISTERED`, `SEZ`, `OVERSEAS`.
  - [GSTSupplyType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTSupplyType.php): `INTRA_STATE`, `INTER_STATE`.
  - [GSTInvoiceType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTInvoiceType.php): `REGULAR`, `BILL_OF_SUPPLY`, `SEZ_WITH_PAYMENT`, `SEZ_WITHOUT_PAYMENT`, `DEEMED_EXPORT`.
- Updated [Invoice.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Models/Invoice.php), [InvoiceItem.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Models/InvoiceItem.php), and [Customer.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Customer.php).

### 2. Business Logic & Calculation Engine (`SalesService`)
Updated [SalesService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Services/SalesService.php) with rigorous GST calculation rules:
- **Automatic Supply Classification**: Compares Organization/Branch State against Place of Supply State to automatically assign `INTRA_STATE` (CGST + SGST) vs `INTER_STATE` (IGST).
- **GSTIN & HSN/SAC Code Snapshotting**: Captures supplier & customer GSTIN and line-item HSN/SAC code at time of invoice creation.
- **Tax Calculation Modes**: Supports both `tax_inclusive` and `tax_exclusive` pricing.
- **Exempt & Nil-Rated Items**: Supports `EXEMPT` and `NIL_RATED` tax categories with 0% tax calculation.
- **GST Round Off**: Computes integer rounding difference (`round_off_amount`) on total invoice payable amount.

---

## Verification Results

### 1. GST Architecture Feature Test Suite
Executed `./vendor/bin/phpunit tests/Feature/GSTInvoicingArchitectureTest.php`:
- **Result**: `OK (3 tests, 19 assertions)`
  - `it_automatically_classifies_intra_state_supply_and_calculates_cgst_sgst` $\rightarrow$ PASS
  - `it_automatically_classifies_inter_state_supply_and_calculates_igst` $\rightarrow$ PASS
  - `it_handles_tax_exclusive_pricing_and_exempt_items` $\rightarrow$ PASS

### 2. Full ERP Test Suite
Executed `./vendor/bin/phpunit`:
- **Result**: `OK (201 tests, 829 assertions)` - 100% green test assertions across all modules.
