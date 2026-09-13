# Implementation Plan - Complete README.md Rewrite

Rewrite `README.md` from scratch to align completely with the actual production codebase, tech stack, simplified product domain (single Product model without Product Family), complete Sales & Invoicing module, and dual database support (PostgreSQL & MySQL).

## User Review Required

> [!IMPORTANT]
> The current `README.md` contains outdated technical specs (React 18 vs React 19, PHPUnit 12 vs PHPUnit 11, outdated Product Family architecture, missing Sales module documentation). This rewrite will replace the historical `README.md` with a comprehensive, accurate documentation covering all 16 requested sections.

## Proposed Changes

### Documentation

#### [MODIFY] [README.md](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/README.md)

Rewrite `README.md` with the following 16 sections:

1. **System Overview**: High-level purpose of the Sanitarywares and Tiles ERP system, business scope (Tiles, Sanitaryware, Granite/Marble, CP Fittings, Accessories), core operating principles.
2. **Architecture**: Domain-Driven Design (DDD) layout (`app/Domains/*`), API Controllers (`app/Http/Controllers/Api/*`), SPA React 19 frontend with Vite & Bootstrap 5, layered architecture (Controller -> Service -> Query/Model).
3. **Tenant Model**: Multi-tenant architecture (`organization_id` scoping), `TenantContext` middleware, multi-branch & multi-warehouse operational hierarchy.
4. **Product Model**: Single `Product` model (simplified from legacy Product Family architecture), `STANDARD` (Tiles, Sanitaryware, Fittings) vs `MEASURED_MATERIAL` (Granite/Marble Slabs with L x W x T), Global Manufacturer Master vs Tenant-scoped Suppliers, Dynamic UOM system (Length, Area, Volume, Mass, Count) and commercial unit conversions (`BOX` <-> `PCS` <-> `SQ.FT`).
5. **Procurement**: Purchase Orders (PO) stateful lifecycle (`DRAFT`, `SUBMITTED`, `APPROVED`, `SENT`, `PARTIALLY_RECEIVED`, `FULLY_RECEIVED`, `CLOSED`, `CANCELLED`), Goods Receipt Note (GRN) receiving & balance tracking, Direct GRN (receiving without PO).
6. **Inventory**: Real-time stock movement, `InventoryObject` records (box/unit counts vs measured slab pieces), `InventoryMovement` audit trail (GRN, Sales, Transfers, Adjustments), Stock Transfers & Adjustments.
7. **Sales**: Sales module details: `SalesService`, `SalesApiController`, `SalesManager`, `NewSaleForm`, `TaxInvoiceModal`, GST tax calculations (CGST, SGST, IGST), real-time stock deduction upon sale confirmation.
8. **Accounting**: Financial records linked to sales invoices, purchase receipts, GST tax profiles, HSN/SAC codes, revenue/expense tracking.
9. **Reporting**: Asynchronous and real-time reporting queries (`SalesReportQuery`, `InventoryReportService`, `GraniteReportQuery`), dashboard analytics, CSV exports, audit log system (`ReportAuditLog`).
10. **Security/RBAC**: Sanctum API authentication, Role-Based Access Control (`super-admin`, `administrator`, `staff`), organization isolation guards.
11. **Installation**: Step-by-step setup instructions (`composer install`, `npm install`, `.env` setup, key generation, database creation, `php artisan migrate --seed`).
12. **Configuration**: Database settings (PostgreSQL & MySQL support), Sanctum configuration, environment variables.
13. **Development Workflow**: Running backend (`php artisan serve`) and frontend Vite (`npm run dev`) or `composer run dev`, running seeders and migrations.
14. **Testing**: Automated testing suite execution via `./vendor/bin/phpunit` or `php artisan test`, test coverage overview across domains.
15. **Current Status**: Exhaustive list of completed production-ready modules (Auth, Organizations, Product Catalog, Procurement, Inventory, Sales & Invoicing, Reporting & Dashboard, RBAC).
16. **Roadmap**: Future planned enhancements (GST e-Invoicing integration, E-Way Bill generation, Mobile barcode/QR scanner app, Advanced BI predictive analytics).

## Verification Plan

### Automated Tests
- Run PHPUnit test suite: `./vendor/bin/phpunit`
- Verify markdown syntax and file formatting.

### Manual Verification
- Check all section titles, code blocks, installation steps, and commands for 100% accuracy against `package.json`, `composer.json`, and current backend controllers/services.
