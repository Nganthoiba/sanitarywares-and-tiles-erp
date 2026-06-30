# ERP LARAVEL MODEL GENERATION PROMPT

# Version: 1.0

# Project: Tiles - Sanitary Management and Accounting System

You are acting as:

- Principal Laravel Architect
- Senior ERP Software Architect
- Senior PHP 8.3 Engineer
- Domain Driven Design (DDD) Expert
- Enterprise Eloquent ORM Designer

Your task is to generate production-grade Laravel 12
Eloquent Models for a commercial Building Materials ERP.

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

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate models inside:

app/

    Domains/

        Master/
            Models/

        Security/
            Models/

        Product/
            Models/

        Inventory/
            Models/

        Purchase/
            Models/

        Sales/
            Models/

        Accounting/
            Models/

        Subscription/
            Models/

=========================================================
GENERAL MODEL RULES
=========================================================

1. Every model must:

- extend Model
- use HasFactory
- use SoftDeletes where applicable

2. Every model must include:

protected $fillable

protected $casts

protected $hidden

3. Never use guarded = [].

4. Use Laravel attribute casting.

5. Use PHP enums where appropriate.

6. Add scopes whenever useful.

7. Add accessors and mutators when necessary.

8. Use explicit relationship names.

9. Never put business logic in models.

10. Models should remain thin.

=========================================================
MODEL TEMPLATE
=========================================================

Generate:

1. Namespace
2. Imports
3. Traits
4. Fillable
5. Hidden
6. Casts
7. Accessors
8. Mutators
9. Local Scopes
10. Relationships
11. Helper Methods
12. PHPDoc
13. Future Extension Notes

=========================================================
MULTI TENANT RULES
=========================================================

Every business model must contain:

organization_id

Every model should contain:

public function organization()

{
return $this->belongsTo(
Organization::class
);
}

=========================================================
MASTER DOMAIN
=========================================================

Generate models for:

Organization
Branch
Warehouse
StorageLocation
Unit
Category
Brand
Manufacturer
TaxProfile

=========================================================
ORGANIZATION MODEL
=========================================================

Requirements:

Relationships:

Organization

    hasMany Branches

    hasMany Warehouses

    hasMany Products

    hasMany Users

Useful methods:

isActive()

isSubscriptionExpired()

activeBranches()

=========================================================
BRANCH MODEL
=========================================================

Relationships:

belongsTo Organization

hasMany Warehouses

hasMany Users

hasMany Customers

hasMany Suppliers

hasMany SalesOrders

hasMany PurchaseOrders

Useful methods:

activeWarehouses()

=========================================================
WAREHOUSE MODEL
=========================================================

Relationships:

belongsTo Organization

belongsTo Branch

hasMany StorageLocations

hasMany InventoryObjects

Useful methods:

activeLocations()

=========================================================
STORAGE LOCATION MODEL
=========================================================

Relationships:

belongsTo Organization

belongsTo Warehouse

hasMany InventoryObjects

Useful methods:

isAvailable()

=========================================================
CATEGORY MODEL
=========================================================

Requirements:

Self referencing hierarchy.

Relationships:

parent()

children()

productFamilies()

Useful methods:

rootCategories()

leafCategories()

=========================================================
PRODUCT DOMAIN
=========================================================

Generate models for:

ProductFamily

ProductVariant

ProductAttribute

ProductAttributeValue

UnitConversion

=========================================================
PRODUCT FAMILY
=========================================================

Relationships:

belongsTo Category

hasMany ProductVariants

hasMany ProductImages

Useful methods:

activeVariants()

=========================================================
PRODUCT VARIANT
=========================================================

Requirements:

This is the sellable product.

Fields:

SKU
GTIN
Barcode

Relationships:

belongsTo ProductFamily

belongsTo Brand

belongsTo TaxProfile

belongsTo PurchaseUnit

belongsTo SalesUnit

belongsTo BaseUnit

hasMany InventoryObjects

hasMany ProductAttributeValues

hasMany UnitConversions

Useful methods:

inventoryBehavior()

currentStock()

currentArea()

=========================================================
INVENTORY DOMAIN
=========================================================

Generate models for:

InventoryObject

InventoryMovement

InventoryReservation

InventoryAllocation

InventorySnapshot

=========================================================
INVENTORY OBJECT
=========================================================

Requirements:

Represents physical inventory.

Examples:

Tile:
100 boxes

Granite:
BG001
BG002
BG003

Sanitary:
25 pieces

Relationships:

belongsTo ProductVariant

belongsTo Warehouse

belongsTo StorageLocation

hasMany InventoryMovements

hasMany Reservations

hasMany Allocations

Useful methods:

availableQuantity()

availableArea()

reserve()

allocate()

release()

transfer()

=========================================================
INVENTORY MOVEMENT
=========================================================

Relationships:

belongsTo InventoryObject

morphTo Reference

Useful methods:

isPurchase()

isSale()

isTransfer()

=========================================================
PURCHASE DOMAIN
=========================================================

Generate models for:

PurchaseOrder
PurchaseOrderItem

GoodsReceiptNote
GoodsReceiptItem

SupplierInvoice
SupplierInvoiceItem

PurchaseReturn
PurchaseReturnItem

=========================================================
SALES DOMAIN
=========================================================

Generate models for:

Quotation
QuotationItem

SalesOrder
SalesOrderItem

Dispatch
DispatchItem

Invoice
InvoiceItem

SalesReturn
SalesReturnItem

=========================================================
ACCOUNTING DOMAIN
=========================================================

Generate models for:

AccountGroup

Account

Journal

JournalEntry

Payment

Receipt

Requirements:

Double entry accounting.

=========================================================
MODEL SCOPES
=========================================================

Generate useful scopes.

Examples:

scopeActive()

scopeInactive()

scopeCurrentOrganization()

scopeCurrentBranch()

scopeAvailable()

scopeReserved()

scopeAllocated()

=========================================================
MODEL CASTS
=========================================================

Use casts:

protected $casts = [

    'is_active' => 'boolean',

    'subscription_start' => 'date',

    'subscription_expiry' => 'date',

    'purchase_price' => 'decimal:2',

    'sales_price' => 'decimal:2',

    'quantity' => 'decimal:4',

    'area' => 'decimal:4',

    'metadata' => 'array',

];

=========================================================
MODEL EVENTS
=========================================================

Recommend:

Observers:

creating
created
updating
updated
deleting
deleted

Examples:

InventoryObjectObserver

ProductVariantObserver

=========================================================
MODEL FACTORIES
=========================================================

Generate:

Factory classes.

Example:

OrganizationFactory

BranchFactory

ProductVariantFactory

InventoryObjectFactory

=========================================================
MODEL POLICIES
=========================================================

Recommend policies.

Examples:

ProductPolicy

InventoryPolicy

PurchasePolicy

SalesPolicy

=========================================================
MODEL TRAITS
=========================================================

Recommend reusable traits.

Examples:

BelongsToOrganization

BelongsToBranch

HasStatus

HasCode

HasAuditTrail

HasMetadata

=========================================================
OUTPUT FORMAT
=========================================================

For every model generate:

1. Business Purpose
2. Namespace
3. Traits
4. Fillable
5. Hidden
6. Casts
7. Accessors
8. Mutators
9. Local Scopes
10. Relationships
11. Helper Methods
12. Recommended Observers
13. Recommended Policies
14. Recommended Factories
15. Recommended Traits
16. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate enterprise-grade
Laravel 12 Eloquent Models
for a commercial ERP supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slab inventory
- Tile unit conversion
- Event-driven architecture
- Millions of inventory records

Never optimize for CRUD.

Always optimize for:

- Domain correctness
- ERP architecture
- Maintainability
- Performance
- Scalability
