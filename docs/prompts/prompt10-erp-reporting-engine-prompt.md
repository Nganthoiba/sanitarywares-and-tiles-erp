You are acting as:

- Principal ERP Architect
- Business Intelligence Architect
- Enterprise Reporting Architect
- Data Warehouse Architect
- Senior Laravel 12 Architect
- Domain Driven Design Expert

Your task is to design and generate
a production-grade Reporting Engine
for a commercial Building Materials ERP.

=========================================================
PROJECT
=========================================================

System:

Tiles - Sanitary Management and Accounting System

This is NOT merely a Tiles ERP.

This is a Building Materials ERP Platform supporting:

- Tiles
- Granite
- Marble
- Quartz
- Sanitaryware
- CP fittings
- Adhesives
- Accessories
- Future business domains

Technology:

Backend:

- Laravel 12
- PHP 8.3+
- PostgreSQL

Frontend:

- React
- Bootstrap 5

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

=========================================================
REPORTING PHILOSOPHY
=========================================================

Reports are generated from:

BUSINESS EVENTS

Examples:

Inventory Movements

Purchase Transactions

Sales Transactions

Journal Entries

Payments

Receipts

Never generate reports from:

Master Tables

Examples:

products
customers
suppliers

=========================================================
REPORTING TYPES
=========================================================

Support:

1. Operational Reports

2. Analytical Reports

3. Financial Reports

4. Inventory Reports

5. Management Reports

6. Audit Reports

7. Dashboard Reports

8. Drill Down Reports

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

app/

    Domains/

        Reporting/

            Services/

            DTOs/

            Exports/

            Reports/

            Queries/

            Filters/

            Charts/

            Policies/

            Cache/

=========================================================
DATABASE STRATEGY
=========================================================

Reports should use:

- transaction tables
- materialized views
- database views
- reporting snapshots
- cached aggregates

Avoid:

heavy joins on live tables.

=========================================================
REPORT CATEGORIES
=========================================================

Generate:

Inventory Reports

Purchase Reports

Sales Reports

Granite Reports

Accounting Reports

Management Reports

Audit Reports

Dashboard Reports

=========================================================
INVENTORY REPORTS
=========================================================

Generate:

Current Stock Report

Stock Ledger Report

Inventory Movement Report

Inventory Valuation Report

Inventory Aging Report

Inventory Adjustment Report

Inventory Damage Report

Inventory Transfer Report

Inventory Reservation Report

Inventory Allocation Report

Warehouse Stock Report

Branch Stock Report

=========================================================
TILE REPORTS
=========================================================

Generate:

Tile Stock Report

Tile Conversion Report

Box/Piece/Sqft Report

Tile Sales Report

Tile Purchase Report

=========================================================
GRANITE REPORTS
=========================================================

Generate:

Granite Slab Report

Granite Inventory Report

Granite Allocation Report

Granite Transfer Report

Granite Cutting Report

Granite Remnant Report

Granite Yield Report

Granite Sales Report

Granite Profitability Report

=========================================================
PURCHASE REPORTS
=========================================================

Generate:

Purchase Register

Purchase Analysis

Supplier Purchase Report

Pending Purchase Orders

GRN Report

Supplier Invoice Report

Purchase Return Report

Purchase Tax Report

Purchase Trend Report

=========================================================
SALES REPORTS
=========================================================

Generate:

Sales Register

Sales Analysis

Customer Sales Report

Sales Return Report

Sales Tax Report

Sales Profitability Report

Sales Trend Report

Sales By Product

Sales By Category

Sales By Branch

=========================================================
ACCOUNTING REPORTS
=========================================================

Generate:

Trial Balance

Profit & Loss

Balance Sheet

Cash Book

Bank Book

General Ledger

Day Book

Journal Register

Customer Outstanding

Supplier Outstanding

Cash Flow Statement

Fund Flow Statement

GST Reports

=========================================================
GST REPORTS
=========================================================

Generate:

HSN Summary

CGST Report

SGST Report

IGST Report

GST Purchase Register

GST Sales Register

Input Credit Report

Output Liability Report

=========================================================
MANAGEMENT REPORTS
=========================================================

Generate:

Branch Performance

Warehouse Performance

Sales Performance

Purchase Performance

Inventory Performance

Customer Performance

Supplier Performance

Profitability Analysis

KPI Dashboard

=========================================================
AUDIT REPORTS
=========================================================

Generate:

User Activity Report

Login Audit Report

Inventory Audit Report

Purchase Audit Report

Sales Audit Report

Accounting Audit Report

Workflow Audit Report

Permission Audit Report

=========================================================
DASHBOARD REPORTS
=========================================================

Generate:

Sales Dashboard

Purchase Dashboard

Inventory Dashboard

Granite Dashboard

Accounting Dashboard

Management Dashboard

=========================================================
FILTERING
=========================================================

Support:

Organization

Branch

Warehouse

Category

Product

Customer

Supplier

Date Range

Financial Year

Status

User

=========================================================
DRILL DOWN
=========================================================

Support:

Summary
↓
Details
↓
Transaction
↓
Document

Examples:

Sales Summary
↓
Invoice
↓
Invoice Item
↓
Inventory Movement

=========================================================
REPORT EXPORTS
=========================================================

Generate support for:

PDF

Excel

CSV

JSON

XML

Print

=========================================================
REPORT CACHING
=========================================================

Generate:

Cache Layer

Report Snapshot

Materialized View

Aggregate Tables

Support:

daily cache

monthly cache

yearly cache

=========================================================
CHARTS
=========================================================

Generate:

Bar Charts

Line Charts

Pie Charts

Area Charts

Column Charts

Trend Charts

Comparison Charts

=========================================================
REPORT SERVICES
=========================================================

Generate:

InventoryReportService

PurchaseReportService

SalesReportService

GraniteReportService

AccountingReportService

ManagementReportService

AuditReportService

DashboardService

=========================================================
QUERY OBJECTS
=========================================================

Generate:

InventoryReportQuery

SalesReportQuery

PurchaseReportQuery

LedgerQuery

GraniteReportQuery

=========================================================
REPORT DTOS
=========================================================

Generate:

InventoryReportDTO

SalesReportDTO

PurchaseReportDTO

LedgerDTO

DashboardDTO

=========================================================
BACKGROUND PROCESSING
=========================================================

Generate queue jobs:

GeneratePDFReport

GenerateExcelReport

RefreshSnapshots

UpdateMaterializedViews

GenerateDashboards

=========================================================
REPORT EVENTS
=========================================================

Generate:

ReportGenerated

ReportExported

DashboardRefreshed

SnapshotCreated

MaterializedViewUpdated

=========================================================
API ENDPOINTS
=========================================================

Generate:

/reports/inventory

/reports/purchase

/reports/sales

/reports/granite

/reports/accounting

/reports/management

/reports/audit

/reports/dashboard

=========================================================
REACT MODULES
=========================================================

Generate:

InventoryReports

PurchaseReports

SalesReports

GraniteReports

AccountingReports

ManagementReports

AuditReports

DashboardReports

=========================================================
SECURITY
=========================================================

Support:

Role Based Access

Branch Restrictions

Warehouse Restrictions

Financial Restrictions

Report Permissions

=========================================================
AUDIT TRAIL
=========================================================

Track:

who generated

when generated

filters used

export type

execution time

=========================================================
PERFORMANCE
=========================================================

Implement:

Pagination

Lazy Loading

Caching

Materialized Views

Aggregates

Background Jobs

Query Optimization

Avoid:

N+1 queries

Heavy joins

Full table scans

=========================================================
OUTPUT FORMAT
=========================================================

For every report generate:

1. Business Purpose
2. Data Source
3. Database Query Strategy
4. Filters
5. Drill Down Structure
6. Services
7. DTOs
8. APIs
9. React UI
10. Exports
11. Performance Optimization
12. Security
13. Audit
14. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate an enterprise-grade
reporting engine supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slab reporting
- Tile conversion reporting
- Purchase reporting
- Sales reporting
- Accounting reporting
- GST reporting
- Dashboard analytics
- Audit reporting
- Millions of transactions

Never optimize for CRUD.

Always optimize for:

- Reporting correctness
- Performance
- Scalability
- Auditability
- Business intelligence
- ERP architecture
