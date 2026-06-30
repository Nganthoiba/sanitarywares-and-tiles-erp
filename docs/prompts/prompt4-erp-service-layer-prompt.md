You are acting as:

- Principal ERP Architect
- Enterprise Solution Architect
- Senior Laravel 12 Architect
- Domain Driven Design Expert
- Enterprise Software Engineer

Your task is to generate production-grade
Service Layer architecture for a commercial
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

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

=========================================================
SERVICE LAYER PHILOSOPHY
=========================================================

Controllers:

- validate
- authorize
- call services
- return responses

Services:

- execute business rules
- orchestrate transactions
- dispatch events

Models:

- persist data
- provide relationships

Events:

- communicate between domains

Never place business logic in:

- controllers
- models
- requests

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate services under:

app/

    Domains/

        Master/
            Services/

        Product/
            Services/

        Inventory/
            Services/

        Purchase/
            Services/

        Sales/
            Services/

        Accounting/
            Services/

=========================================================
SERVICE STRUCTURE
=========================================================

For every service generate:

1. Namespace
2. Constructor Injection
3. Public Methods
4. Private Methods
5. Transactions
6. Events
7. Exceptions
8. DTO usage
9. Logging
10. Audit Trail
11. Scalability Notes

=========================================================
GENERAL RULES
=========================================================

1. Services must be stateless.

2. Services must use constructor injection.

3. Services must use DB transactions.

4. Services must throw domain exceptions.

5. Services must dispatch events.

6. Services must support multi-tenancy.

7. Services must never return arrays.

Use:

- DTOs
- Collections
- Value Objects

8. Services must be testable.

=========================================================
MASTER DOMAIN
=========================================================

Generate services for:

OrganizationService
BranchService
WarehouseService
StorageLocationService
UnitService
CategoryService
BrandService
ManufacturerService
TaxProfileService

=========================================================
ORGANIZATION SERVICE
=========================================================

Methods:

createOrganization()

updateOrganization()

activateOrganization()

deactivateOrganization()

expireSubscription()

renewSubscription()

getOrganizationStatistics()

=========================================================
BRANCH SERVICE
=========================================================

Methods:

createBranch()

updateBranch()

activateBranch()

deactivateBranch()

getBranchStatistics()

=========================================================
WAREHOUSE SERVICE
=========================================================

Methods:

createWarehouse()

updateWarehouse()

transferInventory()

closeWarehouse()

getWarehouseStatistics()

=========================================================
PRODUCT DOMAIN
=========================================================

Generate services for:

ProductFamilyService
ProductVariantService
ProductAttributeService
PricingService
UnitConversionService

=========================================================
PRODUCT FAMILY SERVICE
=========================================================

Methods:

createFamily()

updateFamily()

archiveFamily()

getVariants()

=========================================================
PRODUCT VARIANT SERVICE
=========================================================

Methods:

createVariant()

updateVariant()

changePrice()

assignGTIN()

assignBarcode()

assignTaxProfile()

getCurrentStock()

getCurrentArea()

=========================================================
INVENTORY DOMAIN
=========================================================

Generate services for:

InventoryService
ReservationService
AllocationService
TransferService
AdjustmentService
GraniteService

=========================================================
INVENTORY SERVICE
=========================================================

Methods:

createInventoryObject()

updateInventoryObject()

moveInventory()

adjustInventory()

damageInventory()

scrapInventory()

getCurrentStock()

getCurrentInventory()

=========================================================
RESERVATION SERVICE
=========================================================

Methods:

reserve()

release()

expireReservation()

convertToAllocation()

=========================================================
ALLOCATION SERVICE
=========================================================

Methods:

allocate()

releaseAllocation()

reallocate()

completeAllocation()

=========================================================
TRANSFER SERVICE
=========================================================

Methods:

transfer()

approveTransfer()

cancelTransfer()

=========================================================
GRANITE SERVICE
=========================================================

Methods:

createSlab()

splitSlab()

mergeSlab()

createRemnant()

transferSlab()

allocateSlab()

sellSlab()

calculateArea()

=========================================================
PURCHASE DOMAIN
=========================================================

Generate services for:

PurchaseService
GRNService
SupplierInvoiceService
PurchaseReturnService

=========================================================
PURCHASE SERVICE
=========================================================

Methods:

createPurchaseOrder()

approvePurchaseOrder()

cancelPurchaseOrder()

closePurchaseOrder()

=========================================================
GRN SERVICE
=========================================================

Methods:

createGRN()

receiveGoods()

approveGRN()

rejectGRN()

createInventory()

=========================================================
SUPPLIER INVOICE SERVICE
=========================================================

Methods:

createInvoice()

approveInvoice()

postInvoice()

cancelInvoice()

=========================================================
SALES DOMAIN
=========================================================

Generate services for:

QuotationService
SalesOrderService
DispatchService
InvoiceService
SalesReturnService

=========================================================
SALES ORDER SERVICE
=========================================================

Methods:

createOrder()

approveOrder()

reserveInventory()

allocateInventory()

cancelOrder()

=========================================================
DISPATCH SERVICE
=========================================================

Methods:

createDispatch()

pickInventory()

dispatchInventory()

cancelDispatch()

=========================================================
INVOICE SERVICE
=========================================================

Methods:

createInvoice()

postInvoice()

cancelInvoice()

reverseInvoice()

=========================================================
ACCOUNTING DOMAIN
=========================================================

Generate services for:

AccountService
JournalService
PostingService
PaymentService
ReceiptService

=========================================================
JOURNAL SERVICE
=========================================================

Methods:

createJournal()

postJournal()

reverseJournal()

validateDoubleEntry()

=========================================================
POSTING SERVICE
=========================================================

Methods:

postPurchase()

postSale()

postPayment()

postReceipt()

postAdjustment()

=========================================================
PAYMENT SERVICE
=========================================================

Methods:

createPayment()

approvePayment()

postPayment()

cancelPayment()

=========================================================
SERVICE TRANSACTIONS
=========================================================

Use:

DB::transaction(function () {

    // business logic

});

Example:

createGRN()
↓
create inventory
↓
create movements
↓
dispatch events

=========================================================
SERVICE EVENTS
=========================================================

Dispatch events:

OrganizationCreated
BranchCreated
ProductCreated
InventoryCreated
InventoryReserved
InventoryAllocated
InventoryTransferred
GoodsReceived
PurchaseApproved
InvoiceCreated
InvoicePosted
PaymentPosted

=========================================================
SERVICE EXCEPTIONS
=========================================================

Generate domain exceptions:

InventoryException
AllocationException
ReservationException
PurchaseException
SalesException
AccountingException

=========================================================
SERVICE DTOS
=========================================================

Generate DTOs.

Examples:

CreateProductDTO

CreateInventoryDTO

CreatePurchaseDTO

CreateInvoiceDTO

=========================================================
SERVICE LOGGING
=========================================================

Every service operation should support:

- audit logging
- activity logging
- exception logging

=========================================================
SERVICE POLICIES
=========================================================

Services should support:

authorize()

before execution.

Examples:

InventoryPolicy

PurchasePolicy

SalesPolicy

AccountingPolicy

=========================================================
OUTPUT FORMAT
=========================================================

For every service generate:

1. Business Purpose
2. Service Class
3. Constructor Injection
4. Public Methods
5. Private Methods
6. Transactions
7. Events
8. Exceptions
9. DTOs
10. Policies
11. Audit Logging
12. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate enterprise-grade service
architecture for a commercial ERP
supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slab inventory
- Tile conversions
- Event-driven architecture
- Double-entry accounting
- Millions of inventory records

Never optimize for CRUD.

Always optimize for:

- Business correctness
- Domain integrity
- ERP architecture
- Maintainability
- Scalability
- Testability
