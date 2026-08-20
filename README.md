# Tiles & Sanitaryware ERP System

A comprehensive, multi-tenant business management and Enterprise Resource Planning (ERP) platform purpose-built for businesses dealing in **Tiles**, **Sanitaryware**, **Granite**, **Marble**, **CP Fittings**, **Bathroom Accessories**, and other building materials.

The primary objective of this system is to computerise and streamline the complete operational lifecycle of building-material enterprises — starting from supplier procurement, continuing through goods receiving and multi-unit inventory management, and concluding with sales execution and business intelligence reporting.

---

```text
                        TILES & SANITARYWARE ERP

  ┌──────────────┐      ┌────────────────┐      ┌────────────────────┐
  │   SUPPLIER   │ ───► │ PURCHASE ORDER │ ───► │ GOODS RECEIPT (GRN)│
  └──────────────┘      └────────────────┘      └─────────┬──────────┘
                                                          │
                                                          ▼
  ┌──────────────┐      ┌────────────────┐      ┌────────────────────┐
  │   CUSTOMER   │ ◄─── │     SALES      │ ◄─── │     INVENTORY      │
  └──────┬───────┘      └────────────────┘      └─────────┬──────────┘
         │                                                │
         ▼                                                ▼
  ┌──────────────┐                              ┌────────────────────┐
  │  REPORTING   │                              │ STOCK TRANSFERS &  │
  │ & ANALYTICS  │                              │    ADJUSTMENTS     │
  └──────────────┘                              └────────────────────┘
```

> **Core Operating Principle:**
> _One connected transaction chain in which each operational stage feeds the next — connecting Procurement, Inventory, Sales, and Financial Reporting into a unified, traceable digital ecosystem._

---

## Table of Contents

- [1. Project Vision](#1-project-vision)
- [2. Target Businesses](#2-target-businesses)
- [3. Core Business Lifecycle](#3-core-business-lifecycle)
- [4. Procurement Management](#4-procurement-management)
    - [4.1 Purchase Order Lifecycle & Statuses](#41-purchase-order-lifecycle--statuses)
    - [42 Goods Receipt Note (GRN)](#42-goods-receipt-note-grn)
    - [4.3 Direct GRN (Receiving Without PO)](#43-direct-grn-receiving-without-po)
- [5. Advanced Inventory & Measurement Models](#5-advanced-inventory--measurement-models)
    - [5.1 Units of Measurement (UOM) Dimensions](#51-units-of-measurement-uom-dimensions)
    - [5.2 Product-Specific Unit Conversions](#52-product-specific-unit-conversions)
    - [5.3 Tiles & Box Coverage Dynamics](#53-tiles--box-coverage-dynamics)
    - [5.4 Granite & Marble Slab Management](#54-granite--marble-slab-management)
- [6. Product Catalog & Attribute System](#6-product-catalog--attribute-system)
    - [6.1 Product Types (Standard vs. Measured Material)](#61-product-types-standard-vs-measured-material)
    - [6.2 Product Specifications & Reusable Attributes](#62-product-specifications--reusable-attributes)
    - [6.3 Global Manufacturer Master vs. Tenant Suppliers](#63-global-manufacturer-master-vs-tenant-suppliers)
- [7. Multi-Tenant Architecture & RBAC](#7-multi-tenant-architecture--rbac)
    - [7.1 Organization Isolation](#71-organization-isolation)
    - [7.2 Role-Based Access Control (RBAC)](#72-role-based-access-control-rbac)
    - [7.3 Multi-Branch & Multi-Warehouse Operations](#73-multi-branch--multi-warehouse-operations)
- [8. Sales, Pricing & Auditability](#8-sales-pricing--auditability)
    - [8.1 Sales Flow & Inventory Reduction](#81-sales-flow--inventory-reduction)
    - [8.2 Pricing Models & Tax Profiles](#82-pricing-models--tax-profiles)
    - [8.3 End-to-End Audit Trail](#83-end-to-end-audit-trail)
- [9. Technical Stack & Getting Started](#9-technical-stack--getting-started)
- [10. Project Status & Roadmap](#10-project-status--roadmap)

---

## 1. Project Vision

Traditional building-material businesses often struggle with fragmented software solutions — using one tool for purchasing, another for inventory, spreadsheet tracking for granite slabs, and separate billing software.

This ERP brings all these operational domains together into **one integrated, stateful platform**:

- **Unified Stock Movement:** Every purchase order, delivery receipt, stock transfer, adjustment, and sales invoice updates inventory dynamically.
- **Real-World Product Modeling:** Native support for complex, dimension-dependent products such as tiles (sold per box/sq.ft.) and granite slabs (tracked by individual slab area).
- **Traceable Transaction Chains:** Complete auditability from supplier PO to customer invoice.

---

## 2. Target Businesses

The application is tailored specifically for:

- **Product Domains:**
    - Ceramic, Vitrified, & Porcelain Tiles
    - Sanitaryware & Bathroom Fixtures
    - Granite, Marble, & Natural Stone Slabs
    - CP Fittings & Plumbing Hardware
    - Building Material Accessories
- **Enterprise Formats:**
    - Single-Location Retail Showrooms
    - Wholesale Distributors
    - Hybrid Retail-Wholesale Dealers
    - Multi-Branch & Multi-Warehouse Enterprises

---

## 3. Core Business Lifecycle

The entire platform operates around a connected operational pipeline:

```text
  [Supplier] ──► [Purchase Order] ──► [Goods Receipt (GRN)] ──► [Inventory]
                                                                     │
  [Customer] ◄── [Sales Invoice]  ◄── [Stock Allocation] ◄──────────┤
                                                                     ▼
                                                         [Transfers / Adjustments]
```

> **Key Rule:** Every movement of physical goods is tied to an explicit, stateful business transaction. Manual stock count updates require documented audit reasons.

---

## 4. Procurement Management

The Procurement module governs all purchasing activities from external suppliers.

```text
  User Initiates PO ──► Order Sent to Supplier ──► Supplier Delivers ──► GRN Recorded ──► Stock Updated
```

A **Purchase Order (PO)** records the enterprise's binding commercial request to buy goods. Key fields captured include:

- **Header Details:** Supplier, Branch, PO Number, PO Date, Expected Delivery Date, Reference Number, Payment & Delivery Terms.
- **Line Items:** Products, Quantities, Units, Rates, Item Discounts, Taxes (CGST/SGST/IGST), Total Amounts, Remarks.

### 4.1 Purchase Order Lifecycle & Statuses

Purchase Orders transition through well-defined lifecycle states:

| Status               | Description                                                         |
| :------------------- | :------------------------------------------------------------------ |
| `DRAFT`              | Initial order creation & item entry; editable by procurement staff. |
| `SUBMITTED`          | Submitted for internal review/approval.                             |
| `APPROVED`           | Approved by authorized organization manager.                        |
| `SENT`               | Formally dispatched to the external supplier.                       |
| `PARTIALLY_RECEIVED` | Goods partially delivered; matching GRN recorded.                   |
| `FULLY_RECEIVED`     | All ordered line items fully received in warehouse.                 |
| `CLOSED`             | Order completed or manually concluded.                              |
| `CANCELLED`          | Order voided prior to fulfillment.                                  |

### 4.2 Goods Receipt Note (GRN)

A **Goods Receipt Note (GRN)** records physical delivery at the warehouse. While a PO represents _what was ordered_, the GRN represents _what was physically delivered_.

```text
  PO Ordered Quantity:     100 BOX Tiles
  GRN Received Quantity:    60 BOX
  ───────────────────────────────────────────
  Remaining PO Balance:     40 BOX (PO Status: PARTIALLY_RECEIVED)
```

The system automatically calculates and maintains:

- **Ordered Quantity**
- **Received Quantity to Date**
- **Outstanding Quantity Balance**

### 4.3 Direct GRN (Receiving Without PO)

For emergency stock deliveries, cash purchases, or supplier replacements where no prior PO exists, the system supports **Direct GRN**:

```text
  Supplier Delivery ──► Direct GRN Entry ──► Warehouse Inventory
```

> [!NOTE]
> Direct GRNs are treated as audit exceptions, requiring dedicated manager authorization and documented reasons to preserve procurement integrity.

---

## 5. Advanced Inventory & Measurement Models

One of the greatest complexities in building materials is that products are purchased, stored, priced, and sold using different measurement units.

### 5.1 Units of Measurement (UOM) Dimensions

The system categorizes measurement units into distinct physical dimensions:

| Dimension  | Supported Units                    |
| :--------- | :--------------------------------- |
| **Length** | `MM`, `CM`, `M`, `IN`, `FT`        |
| **Area**   | `SQ.MM`, `SQ.M`, `SQ.IN`, `SQ.FT`  |
| **Volume** | `CU.MM`, `CU.CM`, `CU.M`, `CU.FT`  |
| **Mass**   | `G`, `KG`, `TON`                   |
| **Count**  | `PCS`, `BOX`, `BAG`, `SET`, `SLAB` |

> [!IMPORTANT]
> **Dimension Conversion Rule:** Conversions between units of the _same_ dimension (e.g., `FT` ↔ `MM`, `SQ.FT` ↔ `SQ.M`) are universal standard math. Conversions _across_ dimensions (e.g., `MM` ↔ `SQ.FT`) are strictly disallowed unless governed by explicit product specifications.

### 5.2 Product-Specific Unit Conversions

Commercial packaging varies per product:

- Product A: `1 BOX = 4 PCS = 15.5 SQ.FT`
- Product B: `1 BOX = 2 PCS = 12.0 SQ.FT`

`BOX` → `PCS` is therefore modeled as a **Product-Specific Commercial Conversion** defined individually on the product record.

### 5.3 Tiles & Box Coverage Dynamics

For tiles, the system automatically correlates physical dimensions, piece counts, box quantities, and coverage area:

```text
  Tile Specs:          600 × 600 mm (Thickness: 8 mm)
  Box Packing:         4 PCS / BOX
  Coverage per Box:    0.36 SQ.M / PC × 4 = 1.44 SQ.M (15.5 SQ.FT) per BOX
```

Users can enter sales or purchase orders in **Boxes**, **Pieces**, or **Square Feet**, and the system seamlessly converts and updates inventory accurately.

### 5.4 Granite & Marble Slab Management

Granite and marble are purchased as physical slabs but priced by total surface area (`₹180 / SQ.FT`). Individual slabs within the same bundle vary in physical dimensions:

```text
  Slab #1: 120 IN × 72 IN = 60.00 SQ.FT.
  Slab #2: 118 IN × 70 IN = 57.36 SQ.FT.
  ────────────────────────────────────────────────────
  Total Inventory: 2 SLABS | Total Area: 117.36 SQ.FT.
```

The system tracks **individual slab piece records** with exact length/width dimensions and calculated surface area, ensuring pricing and inventory valuation remain perfectly accurate.

---

## 6. Product Catalog & Attribute System

The Product Catalog forms the master foundation for purchasing, inventory, and sales.

### 6.1 Product Types (Standard vs. Measured Material)

Products follow two core operational configurations:

- **`STANDARD`**: Used for uniform items with consistent unit counts (e.g., Tiles, Sanitaryware, Accessories, CP Fittings).
- **`MEASURED_MATERIAL`**: Used for dimensional materials with variable slab sizes (e.g., Granite Slabs, Marble Blocks).

### 6.2 Product Specifications & Reusable Attributes

Attributes (e.g., _Length_, _Width_, _Thickness_, _Color_, _Finish_, _Material_) are defined as global reusable concepts and attached to products as needed:

```text
  Attribute Definition: Thickness [Numeric, Unit: MM]
  ├── Product A (Vitrified Tile)  ──► Value: 8 MM
  ├── Product B (Parking Tile)    ──► Value: 12 MM
  └── Product C (Granite Slab)    ──► Value: 18 MM
```

### 6.3 Global Manufacturer Master vs. Tenant Suppliers

The application distinguishes between Manufacturers and Suppliers based on real-world business ownership:

```text
  ┌──────────────────────────────────────────────────────────┐
  │         GLOBAL INDEPENDENT MASTER REGISTRY               │
  │   Manufacturer: Kajaria Ceramics Ltd (Global / GSTIN)    │
  └────────────────────────────┬─────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
  ┌──────────────────┐                  ┌──────────────────┐
  │  ORGANIZATION A  │                  │  ORGANIZATION B  │
  │  Tenant Supplier │                  │  Tenant Supplier │
  │  Product Catalog │                  │  Product Catalog │
  └──────────────────┘                  └──────────────────┘
```

- **Manufacturer (Global Master):** Real-world manufacturing business entities (e.g., _Kajaria_, _Somany_, _Jaquar_) exist as global master records shared across tenants.
    - **Super Admin (`super-admin`):** Full CRUD management & verification status control (`VERIFIED`, `UNVERIFIED`, `REJECTED`).
    - **Organization Admin:** Can search the master registry and contribute new manufacturers once; cannot update or delete shared global records.
- **Supplier (Tenant-Scoped):** Commercial vendor entities registered per organization for purchasing transactions.

---

## 7. Multi-Tenant Architecture & RBAC

### 7.1 Organization Isolation

The ERP enforces strict data isolation across tenant organizations:

- Organization-owned models (`Product`, `Inventory`, `PurchaseOrder`, `GRN`, `Supplier`, `Branch`, `Warehouse`) enforce automatic tenant scoping (`organization_id`).
- All requests are validated against active `TenantContext` to prevent cross-tenant data leakage.

### 7.2 Role-Based Access Control (RBAC)

User permissions are governed through roles and explicit permission permissions:

```text
  User ──► Active Role ──► Assigned Permissions
```

- **Super Administrator (`super-admin`):** Global platform management, system seeders, global manufacturer registry verification.
- **Organization Administrator (`administrator`):** Full administrative authority over organization setup, branches, staff, products, suppliers, purchasing, and reports.
- **Staff Member:** Role-restricted operational access (e.g., Inventory Store Manager, Purchasing Agent, Sales Operator).

### 7.3 Multi-Branch & Multi-Warehouse Operations

An organization can configure multiple operational locations:

```text
  Organization HQ
  ├── Main Showroom (Branch BR01)
  │   └── Showroom Display Stock
  └── Central Warehouse (Branch BR02)
      ├── Warehouse WH01 (Storage Location R1-C1-S1)
      └── Warehouse WH02 (Storage Location R2-C2-S2)
```

Stock transfers between branches/warehouses generate formal **Stock Transfer Notes** for strict accountability.

---

## 8. Sales, Pricing & Auditability

### 8.1 Sales Flow & Inventory Reduction

Sales orders and invoices deduct inventory in real time according to the configured product unit rules.

```text
  Customer Order ──► Unit & Conversion Match ──► Real-Time Stock Deduction ──► Sales Invoice
```

### 8.2 Pricing Models & Tax Profiles

- **Pricing Unit Distinction:** Pricing units are decoupled from storage units. Tiles can be stored in `BOX` but priced in `SQ.FT.`, with auto-calculated totals.
- **Tax Profiles:** Full GST compliance with configurable **HSN/SAC** codes, **CGST**, **SGST**, and **IGST** rates.

### 8.3 End-to-End Audit Trail

Every stock movement maintains an unalterable transactional audit record:

```text
  Stock Change (+100 BOX) ──► Audit Log: GRN-00042 (PO-00027, Supplier: ABC Distributors)
  Stock Change (-20 PCS)  ──► Audit Log: INV-00128 (Customer: XYZ Construction)
```

---

## 9. Technical Stack & Getting Started

### Tech Stack

- **Backend Framework:** Laravel 12 (PHP 8.3+)
- **Frontend Engine:** React 18, JSX, Bootstrap 5, FontAwesome 6
- **Asset Pipeline:** Vite
- **Database:** MySQL 8.0+ / MariaDB or psql (PostgreSQL) 16.14
- **Testing Suite:** PHPUnit 12

### Quick Start Guide

1. **Clone & Install Dependencies:**

    ```bash
    git clone https://github.com/Nganthoiba/sanitarywares-and-tiles-erp.git
    cd sanitarywares-and-tiles-erp
    composer install
    npm install
    ```

2. **Configure Environment:**

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

    _Configure your MySQL/Postgresql database credentials in `.env`._

3. **Run Migrations & Seeders:**

    ```bash
    php artisan migrate --seed
    ```

    _This seeds standard units, default organization, sample products, global manufacturers, and the Super Admin account._

4. **Start Development Servers:**

    ```bash
    # Terminal 1: Backend API
    php artisan serve

    # Terminal 2: Frontend Vite
    npm run dev
    ```

5. **Run Automated Test Suite:**
    ```bash
    ./vendor/bin/phpunit --filter=GlobalManufacturerTest
    ./vendor/bin/phpunit --filter=ProductMasterTest
    ```

---

## 10. Project Status & Roadmap

This project is under active continuous development.

### Core Modules Active

- [x] Multi-Tenant Architecture & Organization Context
- [x] Super Admin & Role Switcher UI
- [x] Global Manufacturer Master Registry with Duplicate GSTIN Detection
- [x] Product Catalog & Reusable Specification Attributes
- [x] Multi-Unit Measurement Engine & Conversions (Tile Box Coverage, Slab Dimensions)
- [x] Supplier Registry
- [x] Purchase Orders & Stateful Lifecycle Management
- [x] Goods Receipt Notes (GRN) & PO Balance Tracking
- [x] Automated PHPUnit Test Suites

### Upcoming Enhancements

- [ ] Sales Invoicing & Customer Management
- [ ] Stock Transfer & Branch Reconciliation Workflow
- [ ] Low-Stock Automated Reorder Notifications
- [ ] GST e-Invoicing & E-Way Bill Integration
- [ ] Barcode / QR Code Slab Scanning Engine

---

_Licensed under the [MIT License](LICENSE)._
