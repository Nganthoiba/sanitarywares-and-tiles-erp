You are acting as:

- Principal API Architect
- Enterprise Solution Architect
- Senior Laravel 12 Architect
- REST API Designer
- Domain Driven Design Expert
- ERP Solution Architect

Your task is to design and generate
production-grade APIs for a commercial
Building Materials ERP.

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
- Future product categories

Technology:

Backend:

- Laravel 12
- PHP 8.3+
- PostgreSQL
- Sanctum

Frontend:

- React
- Bootstrap 5
- TanStack Query

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

=========================================================
API PHILOSOPHY
=========================================================

Frontend never talks directly to:

- Models
- Repositories
- Database

Frontend communicates only through APIs.

API Layer:

Request
↓
Validation
↓
Authorization
↓
Service Layer
↓
DTO
↓
API Resource
↓
JSON Response

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

app/

    Http/

        Controllers/

            Api/

                Master/

                Security/

                Product/

                Inventory/

                Purchase/

                Sales/

                Accounting/

                Subscription/

        Requests/

        Resources/

        Middleware/

routes/

    api/

        master.php

        security.php

        product.php

        inventory.php

        purchase.php

        sales.php

        accounting.php

        subscription.php

=========================================================
GENERAL API RULES
=========================================================

1. Use RESTful APIs.

2. Use API Resources.

3. Use Form Requests.

4. Use Policies.

5. Use DTOs.

6. Never return Models directly.

7. Never put business logic in Controllers.

8. Always support pagination.

9. Always support filtering.

10. Always support sorting.

11. Always support searching.

12. Always support multi-tenancy.

=========================================================
API RESPONSE FORMAT
=========================================================

Success:

{
"success": true,
"message": "",
"data": {},
"meta": {}
}

Error:

{
"success": false,
"message": "",
"errors": {},
"code": ""
}

=========================================================
AUTHENTICATION
=========================================================

Use:

Laravel Sanctum

Endpoints:

POST /auth/login
POST /auth/logout
POST /auth/refresh
GET /auth/me

=========================================================
MASTER DOMAIN APIs
=========================================================

Generate APIs for:

organizations
branches
warehouses
storage_locations
units
categories
brands
manufacturers
tax_profiles

=========================================================
ORGANIZATION APIs
=========================================================

GET:

/api/organizations

GET:

/api/organizations/{id}

POST:

/api/organizations

PUT:

/api/organizations/{id}

DELETE:

/api/organizations/{id}

Additional:

/api/organizations/statistics

/api/organizations/subscription

=========================================================
BRANCH APIs
=========================================================

Generate:

index
show
store
update
destroy

Additional:

/statistics

/activate

/deactivate

=========================================================
WAREHOUSE APIs
=========================================================

Generate:

CRUD

Additional:

/inventory

/statistics

/transfer

=========================================================
PRODUCT DOMAIN APIs
=========================================================

Generate APIs for:

product_families
product_variants
product_attributes
product_attribute_values
unit_conversions

=========================================================
PRODUCT FAMILY APIs
=========================================================

Generate:

index
show
store
update
destroy

Additional:

/variants

/images

/statistics

=========================================================
PRODUCT VARIANT APIs
=========================================================

Generate:

CRUD

Additional:

/stock

/inventory

/prices

/attributes

/unit-conversions

/barcode

=========================================================
INVENTORY DOMAIN APIs
=========================================================

Generate APIs for:

inventory_objects
inventory_movements
inventory_reservations
inventory_allocations
inventory_snapshots

=========================================================
INVENTORY APIs
=========================================================

Generate:

GET:

/inventory

GET:

/inventory/{id}

POST:

/inventory

PUT:

/inventory/{id}

DELETE:

/inventory/{id}

Additional:

/transfer

/adjust

/reserve

/release

/allocate

/reallocate

/history

=========================================================
GRANITE APIs
=========================================================

Generate APIs:

GET:

/granite/slabs

POST:

/granite/slabs

GET:

/granite/slabs/{id}

POST:

/granite/slabs/{id}/allocate

POST:

/granite/slabs/{id}/transfer

POST:

/granite/slabs/{id}/cut

POST:

/granite/slabs/{id}/merge

GET:

/granite/slabs/{id}/remnants

=========================================================
PURCHASE APIs
=========================================================

Generate APIs for:

purchase_orders
purchase_order_items
goods_receipt_notes
goods_receipt_items
supplier_invoices
purchase_returns

=========================================================
PURCHASE WORKFLOW APIs
=========================================================

POST:

/purchase-orders

POST:

/purchase-orders/{id}/approve

POST:

/purchase-orders/{id}/cancel

POST:

/grns

POST:

/grns/{id}/approve

POST:

/grns/{id}/reject

POST:

/supplier-invoices

POST:

/supplier-invoices/{id}/post

=========================================================
SALES APIs
=========================================================

Generate APIs for:

quotations
sales_orders
dispatches
invoices
sales_returns

=========================================================
SALES WORKFLOW APIs
=========================================================

POST:

/sales-orders

POST:

/sales-orders/{id}/approve

POST:

/sales-orders/{id}/reserve

POST:

/sales-orders/{id}/allocate

POST:

/dispatches

POST:

/dispatches/{id}/pick

POST:

/dispatches/{id}/dispatch

POST:

/invoices

POST:

/invoices/{id}/post

=========================================================
ACCOUNTING APIs
=========================================================

Generate APIs for:

account_groups
accounts
journals
journal_entries
payments
receipts

=========================================================
ACCOUNTING WORKFLOW APIs
=========================================================

POST:

/journals

POST:

/journals/{id}/post

POST:

/journals/{id}/reverse

POST:

/payments

POST:

/payments/{id}/approve

POST:

/payments/{id}/post

=========================================================
FILTERING
=========================================================

Support:

?search=
?status=
?branch=
?warehouse=
?category=
?date_from=
?date_to=
?page=
?sort=
?direction=

=========================================================
PAGINATION
=========================================================

Support:

?page=1
?per_page=25

Response:

{
"data": [],
"meta": {
"current_page": 1,
"last_page": 10,
"total": 250
}
}

=========================================================
SEARCH
=========================================================

Support:

LIKE search

Full text search

Barcode search

GTIN search

SKU search

=========================================================
API RESOURCES
=========================================================

Generate:

OrganizationResource

BranchResource

WarehouseResource

ProductVariantResource

InventoryObjectResource

PurchaseOrderResource

SalesOrderResource

InvoiceResource

=========================================================
FORM REQUESTS
=========================================================

Generate:

StoreOrganizationRequest

UpdateOrganizationRequest

StoreProductRequest

StoreInventoryRequest

StorePurchaseRequest

StoreSalesRequest

=========================================================
API POLICIES
=========================================================

Generate:

OrganizationPolicy

ProductPolicy

InventoryPolicy

PurchasePolicy

SalesPolicy

AccountingPolicy

=========================================================
API DOCUMENTATION
=========================================================

Generate:

- OpenAPI
- Swagger
- Request examples
- Response examples
- Error examples

=========================================================
MULTI TENANCY
=========================================================

Every endpoint must:

Automatically scope:

organization_id

Example:

User A:
Organization 1

cannot access:

Organization 2 data.

=========================================================
PERFORMANCE
=========================================================

Use:

- eager loading
- pagination
- caching
- query optimization

Avoid:

- N+1 queries
- unnecessary joins

=========================================================
OUTPUT FORMAT
=========================================================

For every API generate:

1. Business Purpose
2. Route
3. HTTP Method
4. Request Validation
5. Authorization
6. Controller
7. Service
8. DTO
9. API Resource
10. Response Example
11. Error Example
12. Events Dispatched
13. Performance Notes
14. Security Notes

=========================================================
FINAL GOAL
=========================================================

Generate enterprise-grade APIs
for a commercial ERP supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slab inventory
- Tile conversions
- Event-driven architecture
- Double-entry accounting
- Millions of transactions

Never optimize for CRUD.

Always optimize for:

- Domain integrity
- API consistency
- Security
- Performance
- Scalability
- Maintainability
