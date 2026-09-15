# Sanitarywares & Tiles ERP System

A comprehensive, multi-tenant business management and Enterprise Resource Planning (ERP) platform purpose-built for enterprises dealing in **Tiles**, **Sanitaryware**, **Granite**, **Marble**, **CP Fittings**, **Bathroom Accessories**, and other building materials.

The primary objective of this system is to digitize and automate the complete operational lifecycle of building-material enterprises — connecting supplier procurement, goods receiving, multi-unit inventory management, point-of-sale execution, tax invoicing, and business intelligence reporting into a single, unified platform.

---

```text
                           SANITYWARE & TILES ERP ARCHITECTURE

  ┌──────────────┐      ┌────────────────┐      ┌────────────────────┐
  │   SUPPLIER   │ ───► │ PURCHASE ORDER │ ───► │ GOODS RECEIPT (GRN)│
  └──────────────┘      └────────────────┘      └─────────┬──────────┘
                                                          │
                                                          ▼
  ┌──────────────┐      ┌────────────────┐      ┌────────────────────┐
  │   CUSTOMER   │ ◄─── │ TAX INVOICE /  │ ◄─── │     INVENTORY      │
  └──────┬───────┘      │     SALES      │      └─────────┬──────────┘
         │              └────────────────┘                │
         ▼                                                ▼
  ┌──────────────┐                              ┌────────────────────┐
  │  REPORTING   │                              │ STOCK TRANSFERS &  │
  │ & ANALYTICS  │                              │    ADJUSTMENTS     │
  └──────────────┘                              └────────────────────┘
```

> **Core Operating Principle:**  
> _One connected transaction chain in which every operational stage feeds the next — linking Procurement, Inventory, Sales, Accounting, and Business Intelligence into a stateful, auditable digital ecosystem._

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Architecture](#2-architecture)
- [3. Tenant Model](#3-tenant-model)
- [4. Product Model](#4-product-model)
- [5. Procurement](#5-procurement)
- [6. Goods Receipt Notes](#6-goods-receipt-notes)
- [7. Inventory](#7-inventory)
- [8. Sales](#8-sales)
- [9. Accounting](#9-accounting)
- [10. Reporting](#10-reporting)
- [11. Security/RBAC](#11-securityrbac)
- [12. Installation](#12-installation)
- [13. Configuration](#13-configuration)
- [14. Development Workflow](#14-development-workflow)
- [15. Testing](#15-testing)
- [16. Current Status](#16-current-status)
- [17. Roadmap](#17-roadmap)

---

## 1. System Overview

Traditional building-material retailers and distributors often rely on fragmented software — separate tools for purchasing, basic billing software without dimensional unit conversions, manual spreadsheets for tracking granite/marble slabs, and disconnected accounting.

This ERP provides an integrated, domain-tailored solution:

- **Unified Stock Lifecycle:** Every Purchase Order, Goods Receipt Note (GRN), Stock Transfer, Adjustment, and Sales Invoice updates inventory dynamically in real time.
- **Real-World Product Modeling:** Native support for complex, dimension-dependent items such as tiles (sold per Box, Piece, or Sq.Ft.) and granite/marble slabs (tracked by individual slab length, width, and surface area).
- **Multi-Tenant Enterprise Structure:** Support for multi-tenant organizations with multi-branch and multi-warehouse operational hierarchies.
- **Traceable Transaction Chains:** Full audit trail connecting supplier procurement through stock movements down to final sales invoices and financial reports.

### Target Businesses

- **Product Domains:** Ceramic & Vitrified Tiles, Sanitaryware & Bathroom Fixtures, Granite & Marble Slabs, CP Fittings & Plumbing Hardware, Building Material Accessories.
- **Enterprise Formats:** Single-Location Retail Showrooms, Wholesale Distributors, Hybrid Retail-Wholesale Dealers, Multi-Branch Enterprises.

---

## 2. Architecture

The application is built using a modern **Domain-Driven Design (DDD)** backend combined with a Single Page Application (SPA) frontend.

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           REACT 19 SPA FRONTEND                        │
  │     React Router v7  │  Bootstrap 5  │  Axios  │  Vite Asset Pipeline   │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ REST API (Sanctum Tokens)
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                          LARAVEL 12 BACKEND API                        │
  │  ┌──────────────────────────────────────────────────────────────────┐  │
  │  │ HTTP Controllers & Requests (app/Http/Controllers/Api/*)         │  │
  │  └────────────────────────────────┬─────────────────────────────────┘  │
  │                                   │                                    │
  │  ┌────────────────────────────────▼─────────────────────────────────┐  │
  │  │ Domain Layer (app/Domains/{Master, Product, Inventory, Sales...}) │  │
  │  │    ├── Services   ├── Queries   ├── Models   ├── DTOs            │  │
  │  └────────────────────────────────┬─────────────────────────────────┘  │
  └───────────────────────────────────┼────────────────────────────────────┘
                                      │ Eloquent ORM
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 DATABASE (PostgreSQL 16+ / MySQL 8.0+)                 │
  └────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Layers

1. **Frontend Layer (`resources/js/`)**: Single Page Application written in React 19, powered by React Router v7, Vite, and Bootstrap 5.
2. **Controller Layer (`app/Http/Controllers/Api/`)**: Thin API controllers handling request validation, routing, HTTP responses, and delegating business logic to domain services.
3. **Domain Layer (`app/Domains/`)**: Encapsulated business domain modules:
    - `Master`: Organizations, Branches, Warehouses, Categories, Brands, Tax Profiles, Units, Customers, Suppliers.
    - `Product`: Unified Product models, attributes, values, unit conversions, organization pricing.
    - `Procurement`: Purchase Orders, GRNs, line items, receiving logic.
    - `Inventory`: InventoryObjects, InventoryMovements, stock adjustments, stock transfers.
    - `Sales`: Invoices, InvoiceItems, sales state machine, tax computation, customer ledgers.
    - `Reporting`: Optimized report queries (`SalesReportQuery`, `GraniteReportQuery`), DTOs, audit logs.
4. **Database Layer**: Migration scripts supporting dual-database compatibility (PostgreSQL 16+ primary, MySQL 8.0+ / MariaDB supported).

---

## 3. Tenant Model

The platform is designed around strict multi-tenancy with a multi-tiered organization structure.

```text
  Super Admin (Global Platform Management)
  └── Organization Tenant (organization_id)
      ├── Branch BR-01 (Showroom)
      │   └── Warehouse WH-01 (Display Floor Stock)
      └── Branch BR-02 (Central Depot)
          ├── Warehouse WH-02 (Main Storage Warehouse)
          └── Warehouse WH-03 (Granite Yard)
```

### Multi-Tenancy Rules

- **Data Isolation:** Organization-owned models (`Product`, `InventoryObject`, `PurchaseOrder`, `GRN`, `Invoice`, `Supplier`, `Customer`, `Branch`, `Warehouse`) enforce strict `organization_id` tenant scoping.
- **Tenant Context (`TenantContext`):** Automatically injects and resolves active tenant context per request to prevent cross-tenant data leakage.
- **Operational Hierarchy:** An Organization contains multiple **Branches**, and each Branch contains one or more **Warehouses** (storage locations).
- **Stock Transfer Notes:** Inter-warehouse and inter-branch stock transfers require formal transfer notes and audit logs.

---

## 4. Product Model

The Product Catalog represents a streamlined, unified domain model. The legacy Product Family concept has been fully removed in favor of direct category/brand associations on a single `Product` model.

```text
                             UNIFIED PRODUCT MODEL

  ┌──────────────────────────────────────────────────────────────────────┐
  │                             PRODUCT                                  │
  │  name, sku, category_id, brand_id, tax_profile_id, inventory_behavior  │
  └──────────────────────────────────┬───────────────────────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
  ┌───────────────────────┐                       ┌──────────────────────┐
  │   STANDARD PRODUCT    │                       │  MEASURED MATERIAL   │
  │ (Tiles, Sanitaryware) │                       │   (Granite / Marble) │
  │ Units: BOX, PCS, SQFT │                       │ Slabs: L × W × T     │
  └───────────────────────┘                       └───────────────────────┘
```

### Product Behaviors

- **`STANDARD`**: Uniform items with consistent unit counts (e.g., Tiles, Sanitaryware, Accessories, CP Fittings).
- **`MEASURED_MATERIAL`**: Dimensional items where individual pieces (slabs) have unique length, width, thickness, and calculated surface areas (e.g., Granite & Marble Slabs).

### Dynamic Units of Measurement (UOM) & Commercial Conversions

- **Dimensions:** Length (`MM`, `CM`, `M`, `FT`), Area (`SQ.MM`, `SQ.M`, `SQ.FT`), Mass (`KG`, `TON`), Count (`PCS`, `BOX`, `SLAB`).
- **Product Commercial Conversions:** Defined per product (e.g., `1 BOX = 4 PCS = 15.5 SQ.FT`). Orders can be entered in Boxes, Pieces, or Square Feet, and the system automatically calculates stock movements and pricing.

### Global Manufacturer Registry vs. Tenant Suppliers

- **Global Manufacturer Master:** Shared global registry of real-world manufacturers (e.g., _Kajaria_, _Somany_, _Jaquar_). Super Admins maintain verification status (`VERIFIED`, `UNVERIFIED`).
- **Tenant Suppliers:** Commercial vendors registered per tenant organization for purchasing transactions.

---

## 5. Procurement

The Purchase domain manages the receipt of goods from suppliers.

The primary procurement workflow supports direct receiving because many
organizations purchase and receive goods without creating a Purchase
Requisition or Purchase Order first.

The primary workflow is:

Supplier
↓
Goods Receipt Note (GRN)
↓
GRN Approval / Posting
↓
Inventory
↓
Supplier Invoice
↓
Accounts Payable
↓
Payment

Purchase Requisitions and Purchase Orders are supported as optional
procurement workflows for organizations that require advance purchasing,
approval, supplier commitments, or expected-quantity controls.

The optional workflow is:

Purchase Requisition
↓
Purchase Order
↓
Goods Receipt Note
↓
Inventory
↓
Supplier Invoice
↓
Accounts Payable
↓
Payment

---

## 6. Goods Receipt Notes

The Goods Receipt Note (GRN) represents the physical receipt of goods from a supplier.

A GRN can be created in two ways:

1. Direct GRN
2. Purchase Order-based GRN

A Direct GRN does not require a Purchase Order.

A Purchase Order-based GRN references the relevant Purchase Order and validates received quantities against the outstanding order quantity according to the organization's over-receipt policy.

Inventory is created or increased when the GRN is approved/posted according to the applicable workflow.

Purchase Orders do not increase physical inventory.

The GRN process supports:

- Supplier
- Warehouse
- Receiving date
- Receipt source
- Products
- Received quantities
- Units
- Purchase prices
- Taxes
- Batch information
- Packaging information
- Purchase Order reference when applicable
- Approval
- Inventory posting
- Reversal/cancellation where supported

---

## 7. Inventory

Inventory tracking is fully stateful, real-time, and auditable across branches and warehouses.

```text
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                            INVENTORY OBJECT                             │
  │  organization_id │ branch_id │ warehouse_id │ product_id │ stock_qty    │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      INVENTORY MOVEMENT (AUDIT LOG)                     │
  │  movement_type: GRN / SALE / TRANSFER / ADJUSTMENT                     │
  │  reference_type & ID │ quantity_change │ balance_after │ reason         │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Inventory Capabilities

- **Batch & Box Stock:** Standard products are tracked by piece/box quantity and warehouse bin location.
- **Dimensional Slab Stock:** Granite/Marble slabs are tracked as discrete physical slab records (`InventoryObject`) recording exact Length × Width dimensions, thickness, and total square footage.
- **Stock Transfers:** Formal inter-warehouse transfer notes with dispatch and receipt confirmations.
- **Stock Adjustments:** Documented manual count adjustments requiring reason codes and supervisor audit trails.

---

## 8. Sales

The Sales & Invoicing module supports a **Two-Track Sales Architecture** designed for building-material enterprises, handling both walk-in retail customers and structured project/wholesale orders.

```text
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    TRACK 1: FULL SALES WORKFLOW                         │
  │  Quotation ──► Sales Order ──► Reservation ──► Picking / Allocation     │
  │            ──► Dispatch ──► Invoice ──► Payment                         │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                 TRACK 2: DIRECT COUNTER SALE (WALK-IN)                  │
  │  Counter Sale Entry ──► Invoice + Immediate Dispatch ──► Payment        │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Two-Track Sales Workflows

#### 1. Full Sales Workflow (Project & Wholesale Orders)
Designed for enterprise, project, and deferred delivery orders where quotation, approval, stock allocation, and dispatch occur over multiple stages:
- **Quotation:** Estimate generated for customer approval.
- **Sales Order:** Confirmed commercial order locking prices and terms.
- **Reservation:** Inventory reserved in warehouse to prevent stockouts before fulfillment.
- **Picking / Allocation:** Specific warehouse bin locations or slab records designated for dispatch.
- **Dispatch:** Physical release of goods with delivery note/gate pass.
- **Invoice:** Formal GST Tax Invoice generated on dispatch or milestone billing.
- **Payment:** Customer payment settlement posted against customer ledger.

#### 2. Direct Counter Sale (Walk-in Retail Customers)
Streamlined point-of-sale workflow for immediate cash/card counter sales:
1. **Order Entry (`NewSaleForm.jsx` / `SalesApiController`):**
    - Select Customer, Branch, and Warehouse.
    - Add line items with choice of sale unit (`BOX`, `PCS`, `SQ.FT`, `SLAB`).
    - Auto-calculate item subtotal, discounts, and GST tax breakdown based on customer state vs warehouse state (CGST + SGST for intra-state, IGST for inter-state).
2. **Invoice Posting & Fulfillment (`SalesService`):**
    - Creates `Invoice` and `InvoiceItem` records.
    - Reserves and deducts inventory immediately from designated warehouse.
    - Records an `InventoryMovement` entry of type `SALE`.
3. **Invoice & Billing (`TaxInvoiceModal.jsx`):**
    - Generates GST-compliant Tax Invoices displaying HSN/SAC codes, tax rates, vehicle/dispatch details, and customer billing address.

---

## 9. Accounting

The Accounting layer links commercial transactions directly to financial tracking and GST reporting.

- **GST Tax Profiles:** Configurable tax profiles with HSN/SAC codes, CGST %, SGST %, and IGST %.
- **Intra-State vs. Inter-State Logic:** Automatically applies CGST + SGST when supplier/warehouse and customer are in the same state, or IGST when crossing state borders.
- **Customer & Supplier Ledgers:** Tracks accounts receivable (invoices) and accounts payable (GRNs / supplier bills).
- **Financial Auditability:** Immutable transaction history linking every invoice and purchase receipt to accounting entries.

---

## 10. Reporting

The Reporting module provides real-time business intelligence, dashboard metrics, and audit log tracking.

### Core Reporting Features

- **Sales Analytics (`SalesReportQuery`):** Sales by Category, Brand, Branch, Date Range, and Revenue analysis.
- **Inventory Reporting (`InventoryReportService`):** Stock valuation, low-stock alerts, movement summaries, slab coverage reports (`GraniteReportQuery`).
- **Dashboard Service (`DashboardService`):** High-level KPI aggregations for executive dashboards (total sales, total inventory value, pending POs).
- **Audit Logs (`ReportAuditLog`):** Tracks report generation history, parameter filters, user actions, and CSV export activities.

---

## 11. Security/RBAC

Security and access control are enforced at both API and UI levels.

### Authentication & Authorization

- **API Authentication:** Laravel Sanctum token-based authentication.
- **Role-Based Access Control (RBAC):**
    - `super-admin`: Global platform management, system seeders, global manufacturer verification.
    - `administrator`: Full administrative authority over organization setup, branches, staff, catalog, procurement, sales, and reports.
    - `staff`: Role-restricted operational permissions (e.g., Inventory Store Manager, Sales Operator, Purchasing Agent).
- **Tenant Authorization Guard:** Prevents authorized users of Organization A from reading or modifying resources belonging to Organization B.

---

## 12. Installation

### Prerequisites

- **PHP:** 8.2 or 8.3+ (with `pdo`, `pdo_pgsql` / `pdo_mysql`, `mbstring`, `bcmath`, `xml`, `curl` extensions)
- **Composer:** 2.x
- **Node.js:** 18.x or 20.x+ & `npm`
- **Database:** PostgreSQL 16+ (Recommended) or MySQL 8.0+ / MariaDB / SQLite

### Step-by-Step Installation Guide

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/Nganthoiba/sanitarywares-and-tiles-erp.git
    cd sanitarywares-and-tiles-erp
    ```

2. **Install PHP Dependencies:**

    ```bash
    composer install
    ```

3. **Install JavaScript Dependencies:**

    ```bash
    npm install
    ```

4. **Environment Setup:**

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

5. **Configure Database in `.env`:**

    ```env
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=tiles_and_sanitary
    DB_USERNAME=postgres
    DB_PASSWORD=your_password
    ```

6. **Run Database Migrations & Seeders:**
    ```bash
    php artisan migrate --seed
    ```
    _Seeds default units, sample organization, super-admin account, tax profiles, and sample categories._

---

## 13. Configuration

### Key Environment Variables (`.env`)

| Variable                   | Description          | Example                              |
| :------------------------- | :------------------- | :----------------------------------- |
| `APP_NAME`                 | Application Title    | `Sanitarywares & Tiles ERP`          |
| `APP_ENV`                  | Environment Mode     | `local` / `production`               |
| `APP_URL`                  | Base URL             | `http://localhost:8000`              |
| `DB_CONNECTION`            | Database Driver      | `pgsql` / `mysql` / `sqlite`         |
| `DB_HOST`                  | Database Server Host | `127.0.0.1`                          |
| `DB_PORT`                  | Database Port        | `5432` (PostgreSQL) / `3306` (MySQL) |
| `SANCTUM_STATEFUL_DOMAINS` | Sanctum CORS Domains | `localhost:8000,127.0.0.1:8000`      |

---

## 14. Development Workflow

### Starting the Development Environment

You can start backend, queue listener, logs, and frontend Vite server concurrently:

```bash
# Option 1: Run standard Laravel dev command (runs backend + Vite concurrently)
composer run dev

# Option 2: Run separate terminals
# Terminal 1: Backend API Server
php artisan serve

# Terminal 2: Frontend Vite Development Server
npm run dev
```

### Production Build

```bash
npm run build
```

---

## 15. Testing

The project maintains an extensive PHPUnit automated test suite covering master records, procurement, inventory, sales, and reporting.

### Tech Stack Specifications

- **PHPUnit Version:** PHPUnit 11 (`^11.5.50`)
- **Framework:** Laravel 12 Testing Suite

### Running Automated Tests

```bash
# Run complete test suite
./vendor/bin/phpunit

# Run specific domain test suite
./vendor/bin/phpunit --filter=ProductMasterTest
./vendor/bin/phpunit --filter=SalesApiTest
./vendor/bin/phpunit --filter=PurchaseOrderTest
```

---

## 16. Current Status

The application is in active, stable production-ready state with all core operational modules implemented:

- [x] Multi-Tenant Architecture & `TenantContext` isolation
- [x] Super Admin & Organization Switcher UI
- [x] Unified Product Catalog (Single `Product` model, `STANDARD` vs `MEASURED_MATERIAL`)
- [x] Global Manufacturer Registry with duplicate GSTIN detection
- [x] Dynamic Measurement Engine & UOM commercial conversions (`BOX` <-> `PCS` <-> `SQ.FT`)
- [x] Supplier & Customer Masters
- [x] Procurement Module (PO state machine, Goods Receipt Notes, Direct GRN)
- [x] Multi-Warehouse Inventory Management & Slab tracking
- [x] Sales & Invoicing Module (`SalesService`, `SalesApiController`, `TaxInvoiceModal`)
- [x] GST Tax Calculation Engine (CGST, SGST, IGST)
- [x] Reporting & Dashboard Engine (`SalesReportQuery`, `GraniteReportQuery`, `ReportAuditLog`)
- [x] Role-Based Access Control (RBAC) & Sanctum authentication
- [x] Comprehensive Automated PHPUnit Test Suite (180+ tests passing)

---

## 17. Roadmap

Planned future features and enhancements:

- [ ] **GST e-Invoicing & E-Way Bill Integration:** Direct API connectivity with NIC portal for automated e-Invoice IRN generation and E-Way bill printing.
- [ ] **Mobile Barcode & QR Code Scanner:** Mobile app for warehouse staff to scan granite slab QR tags and box barcodes during GRN and dispatch.
- [ ] **Advanced Customer Credit & Payment Tracking:** Partial payment recording, customer credit limit enforcement, and overdue payment reminder notifications.
- [ ] **Predictive Inventory Analytics:** Low-stock automated reorder alerts based on historical sales velocity.

---

_Licensed under the [MIT License](LICENSE)._
