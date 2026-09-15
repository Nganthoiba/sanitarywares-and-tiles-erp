# Production GST Invoicing & Backend Source-of-Truth Architecture Walkthrough

## Summary of Accomplishments

### 1. Authoritative Backend Pricing & Tax Engine
- Enforced the architectural rule: **Frontend is display-only; Backend is sole source of truth**.
- Added `calculatePreview()` in [SalesService.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Services/SalesService.php) to calculate exact, authoritative tax breakdowns (CGST/SGST/IGST, taxable amount, round-off, grand total) without mutating database or stock.
- Exposed `POST /api/sales/calculate-preview` endpoint in [SalesApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Sales/SalesApiController.php) and [routes/api.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/routes/api.php).
- Updated [NewSaleForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/sales/NewSaleForm.jsx) to call `/api/sales/calculate-preview` with debounced preview updates while retaining instant UI display fallback.

### 2. Comprehensive GST Domain Features
- Added migration `2026_09_15_000002_enhance_gst_invoicing_domain.php` adding GST domain fields across tables:
  - `invoices`: `supplier_gstin`, `customer_gstin`, `place_of_supply_state`, `gst_registration_type`, `supply_type`, `invoice_type`, `is_reverse_charge`, `is_tax_inclusive`, `round_off_amount`, `irn`, `ack_no`, `ack_date`, `eway_bill_no`, `eway_bill_date`.
  - `invoice_items`: `hsn_sac_code`, `tax_category` (`TAXABLE`, `EXEMPT`, `NIL_RATED`, `NON_GST`), `is_tax_inclusive`.
  - `customers`: `gst_registration_type`, `state_code`.
- Added Enums: [GSTRegistrationType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTRegistrationType.php), [GSTSupplyType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTSupplyType.php), [GSTInvoiceType.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Sales/Enums/GSTInvoiceType.php).

---

## Verification Results

### 1. GST Architecture Feature Test Suite
Executed `./vendor/bin/phpunit tests/Feature/GSTInvoicingArchitectureTest.php`:
- **Result**: `OK (4 tests, 33 assertions)`
  - `it_automatically_classifies_intra_state_supply_and_calculates_cgst_sgst` $\rightarrow$ PASS
  - `it_automatically_classifies_inter_state_supply_and_calculates_igst` $\rightarrow$ PASS
  - `it_handles_tax_exclusive_pricing_and_exempt_items` $\rightarrow$ PASS
  - `it_provides_authoritative_backend_tax_preview_endpoint` $\rightarrow$ PASS

### 2. Full ERP Test Suite
Executed `./vendor/bin/phpunit`:
- **Result**: `OK (202 tests, 843 assertions)` - 100% green test assertions across all modules.
