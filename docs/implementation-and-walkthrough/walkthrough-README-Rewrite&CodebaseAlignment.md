# Walkthrough - README.md Rewrite & Codebase Alignment

I have completely rewritten [README.md](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/README.md) to accurately reflect the real, current state of the Sanitarywares and Tiles ERP system.

## Changes Made

### Documentation

#### [README.md](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/README.md)
Rewrote the entire `README.md` file from scratch with the 16 requested sections:

1. **System Overview**: Business domain scope (Tiles, Sanitaryware, Granite/Marble, Fittings, Accessories), core operating principles.
2. **Architecture**: Domain-Driven Design (DDD) backend structure (`app/Domains/*`), React 19 SPA frontend with Vite 7 & Bootstrap 5, Controller-Service-Query architecture.
3. **Tenant Model**: Multi-tenancy isolation (`organization_id`), `TenantContext` middleware, multi-branch & multi-warehouse hierarchy per organization.
4. **Product Model**: Unified single `Product` model (`STANDARD` vs `MEASURED_MATERIAL` with slab dimensions), Global Manufacturer Master vs Tenant-scoped Suppliers, Dynamic UOM engine and commercial unit conversions (`BOX` <-> `PCS` <-> `SQ.FT`).
5. **Procurement**: PO lifecycle states (`DRAFT` to `CLOSED`/`CANCELLED`), Goods Receipt Note (GRN) receiving & balance tracking, Direct GRNs.
6. **Inventory**: Real-time stock movement, `InventoryObject` tracking (box/unit counts vs measured slab pieces), `InventoryMovement` audit trail, transfers & adjustments.
7. **Sales**: Completed sales module (`SalesService`, `SalesApiController`, `SalesManager`, `NewSaleForm`, `TaxInvoiceModal`, GST tax calculations, real-time inventory deduction).
8. **Accounting**: Financial records tied to invoices, GRNs, tax profiles (CGST/SGST/IGST), HSN/SAC codes.
9. **Reporting**: Reporting engine queries (`SalesReportQuery`, `InventoryReportService`, `GraniteReportQuery`), dashboard analytics, CSV exports, audit log system (`ReportAuditLog`).
10. **Security/RBAC**: Sanctum API tokens, Role-Based Access Control (`super-admin`, `administrator`, `staff`), organization isolation guards.
11. **Installation**: Step-by-step setup guide (`composer install`, `npm install`, `.env`, migrations & seeders).
12. **Configuration**: Dual database support (PostgreSQL & MySQL/MariaDB), environment variables, Sanctum config.
13. **Development Workflow**: Running backend (`php artisan serve`) and Vite frontend (`npm run dev`) / `composer run dev`.
14. **Testing**: Running PHPUnit tests (`./vendor/bin/phpunit`), test suite structure across domains.
15. **Current Status**: Exhaustive check-off list of completed, production-ready modules.
16. **Roadmap**: Planned future features (GST e-Invoicing, E-Way Bill integration, Barcode/QR scanning app, BI analytics).

## Verification

### Automated Tests
- Executed `./vendor/bin/phpunit`: **180 tests passed** cleanly with 720 assertions.
