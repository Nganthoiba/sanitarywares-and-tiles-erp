You are acting as a Principal ERP Architect, Database Architect,
and Senior Laravel 12 Engineer.

Your task is to design and generate production-grade Laravel
database migrations, models, relationships, enums, factories,
and architectural recommendations for a commercial
Building Materials ERP system.

======================================================
PROJECT
======================================================

System Name:

Tiles - Sanitary Management and Accounting System

This is NOT merely a Tiles ERP.

It is a multi-tenant Building Materials ERP supporting:

- Tiles
- Granite
- Marble
- Quartz
- Sanitaryware
- CP fittings
- Adhesives
- Accessories
- Future building material products

Technology Stack:

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
- Multi-tenant SaaS
- Event Driven Architecture

======================================================
GENERAL RULES
======================================================

1. Every business table MUST contain:

    organization_id

except system tables.

2. Every migration MUST include:

    created_at
    updated_at
    softDeletes()

unless explicitly excluded.

3. Every migration MUST define:
    - foreign keys
    - indexes
    - unique constraints

4. Never denormalize prematurely.

5. Use PostgreSQL optimized types.

6. Use unsigned big integer equivalent:

    foreignId()

7. Use enum tables or PHP enums
   instead of database ENUM types.

8. Every model MUST contain:
    - relationships
    - casts
    - scopes
    - fillable fields

9. Use ULID only if justified.

10. Design for:
    - multi branch
    - multi warehouse
    - SaaS
    - future scalability

======================================================
ERP PHILOSOPHY
======================================================

The ERP models:

BUSINESS ENTITIES:

- Organization
- Branch
- Warehouse
- Storage Location
- Product
- Product Variant
- Inventory Object
- Customer
- Supplier
- Invoice

BUSINESS EVENTS:

- Purchase
- Sale
- Transfer
- Return
- Damage
- Adjustment
- Payment

Database tables must represent
real business concepts.

======================================================
INVENTORY PHILOSOPHY
======================================================

Inventory is NOT a quantity.

Inventory is a collection of
physical objects.

Examples:

Tiles:

100 boxes

Granite:

BG001
BG002
BG003

Sanitary:

25 pieces

Inventory behaviors:

STANDARD
CONVERTIBLE
SLAB
SERIAL
BATCH
BUNDLE
ROLL

======================================================
MASTER DOMAIN
======================================================

Generate migrations and models for:

organizations

branches

warehouses

storage_locations

units

categories

brands

manufacturers

tax_profiles

======================================================
SECURITY DOMAIN
======================================================

Generate migrations and models for:

users

roles

permissions

permission_groups

user_roles

role_permissions

user_scopes

Requirements:

- unlimited dynamic roles
- unlimited permissions
- data scope restrictions
- branch scope
- warehouse scope

======================================================
PRODUCT DOMAIN
======================================================

Generate migrations and models for:

product_families

product_variants

product_attributes

product_attribute_values

unit_conversions

Requirements:

Category
↓
Product Family
↓
Product Variant
↓
Inventory Object

GTIN belongs to Product Variant.

SKU belongs to Product Variant.

Barcode belongs to Product Variant.

Use EAV for product specifications.

Examples:

Tiles:

- length
- width
- box_quantity
- sqft_per_box

Granite:

- thickness
- finish
- origin

Sanitary:

- color
- material
- warranty

======================================================
INVENTORY DOMAIN
======================================================

Generate migrations and models for:

inventory_objects

inventory_movements

inventory_reservations

inventory_allocations

inventory_snapshots

Requirements:

Inventory object examples:

Tile:
100 boxes

Granite:
BG001
BG002
BG003

Sanitary:
25 pieces

Inventory movement types:

PURCHASE
SALE
RETURN
TRANSFER
ADJUSTMENT
DAMAGE
ALLOCATION
REALLOCATION

Inventory statuses:

AVAILABLE
RESERVED
ALLOCATED
PICKED
DISPATCHED
DAMAGED
RETURNED
SCRAPPED

======================================================
GRANITE DOMAIN
======================================================

Granite uses SLAB inventory.

Examples:

BG001
BG002
BG003

Granite allocation is performed
by slab.

Granite sales reduce slab area.

Support remnants:

Example:

BG001
60 sqft

becomes

BG001
20 sqft

BG001-R1
15 sqft

======================================================
PURCHASE DOMAIN
======================================================

Generate migrations and models for:

purchase_requisitions

purchase_requisition_items

purchase_orders

purchase_order_items

goods_receipt_notes

goods_receipt_items

supplier_invoices

supplier_invoice_items

purchase_returns

purchase_return_items

Workflow:

Purchase Requisition
↓
Purchase Order
↓
GRN
↓
Inventory Creation
↓
Supplier Invoice
↓
Payment

Inventory is created only
from GRN.

======================================================
SALES DOMAIN
======================================================

Generate migrations and models for:

quotations

quotation_items

sales_orders

sales_order_items

dispatches

dispatch_items

invoices

invoice_items

sales_returns

sales_return_items

Workflow:

Quotation
↓
Sales Order
↓
Reservation
↓
Allocation
↓
Picking
↓
Dispatch
↓
Invoice
↓
Accounting

======================================================
ACCOUNTING DOMAIN
======================================================

Generate migrations and models for:

account_groups

accounts

journals

journal_entries

payments

receipts

Requirements:

Double entry accounting.

Generate:

- General Ledger
- Trial Balance
- Profit and Loss
- Balance Sheet

======================================================
REPORTING DOMAIN
======================================================

Reports are generated from:

- inventory movements
- purchases
- sales
- journal entries

Never from master tables.

======================================================
OUTPUT FORMAT
======================================================

For every table generate:

1. Business purpose
2. Migration
3. Foreign keys
4. Indexes
5. Constraints
6. Laravel model
7. Relationships
8. Recommended services
9. Recommended policies
10. Recommended events
11. Recommended factories
12. Recommended seeders
13. Future scalability considerations

Always optimize for:

- maintainability
- performance
- scalability
- SaaS architecture
- ERP best practices

Never optimize merely for CRUD convenience.
