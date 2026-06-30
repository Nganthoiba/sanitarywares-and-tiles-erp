You are acting as:

- Principal Enterprise Architect
- Event-Driven Architecture Expert
- Domain Driven Design Expert
- Senior Laravel 12 Architect
- Enterprise ERP Solution Architect

Your task is to design and generate
a production-grade Event Driven Architecture
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
EVENT DRIVEN PHILOSOPHY
=========================================================

Services should never directly communicate
with other business domains.

Bad:

PurchaseService
↓
InventoryService
↓
AccountingService

Good:

PurchaseService
↓
PurchaseApproved Event
↓
Listeners

Inventory Listener
Accounting Listener
Audit Listener
Notification Listener

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

app/

    Domains/

        Master/
            Events/
            Listeners/

        Product/
            Events/
            Listeners/

        Inventory/
            Events/
            Listeners/

        Purchase/
            Events/
            Listeners/

        Sales/
            Events/
            Listeners/

        Accounting/
            Events/
            Listeners/

        Notification/
            Events/
            Listeners/

=========================================================
EVENT RULES
=========================================================

1. Events represent business facts.

2. Events must be immutable.

3. Events contain only business data.

4. Events never contain business logic.

5. Listeners execute business actions.

6. Events should be queueable.

7. Events should support replay.

8. Events should support audit logging.

=========================================================
EVENT CLASS STRUCTURE
=========================================================

For every event generate:

1. Namespace
2. Constructor
3. Readonly properties
4. Serialization
5. Queue support
6. Broadcasting support
7. Audit support

=========================================================
MASTER DOMAIN EVENTS
=========================================================

Generate events:

OrganizationCreated
OrganizationActivated
OrganizationDeactivated
SubscriptionExpired
SubscriptionRenewed

BranchCreated
BranchActivated
BranchDeactivated

WarehouseCreated
WarehouseClosed

StorageLocationCreated

CategoryCreated

=========================================================
PRODUCT DOMAIN EVENTS
=========================================================

Generate events:

ProductFamilyCreated
ProductFamilyArchived

ProductVariantCreated
ProductVariantUpdated

ProductPriceChanged

ProductTaxChanged

ProductAttributeAssigned

GTINAssigned

BarcodeAssigned

=========================================================
INVENTORY DOMAIN EVENTS
=========================================================

Generate events:

InventoryObjectCreated

InventoryAdjusted

InventoryTransferred

InventoryDamaged

InventoryScrapped

InventoryReserved

InventoryReservationReleased

InventoryAllocated

InventoryAllocationReleased

InventoryPicked

InventoryDispatched

InventoryReturned

InventoryCountCompleted

=========================================================
GRANITE DOMAIN EVENTS
=========================================================

Generate events:

GraniteSlabCreated

GraniteSlabTransferred

GraniteSlabAllocated

GraniteSlabCut

GraniteRemnantCreated

GraniteSlabMerged

GraniteSlabSold

=========================================================
PURCHASE DOMAIN EVENTS
=========================================================

Generate events:

PurchaseRequisitionCreated

PurchaseOrderCreated

PurchaseOrderApproved

PurchaseOrderCancelled

GoodsReceived

GRNCreated

GRNApproved

GRNRejected

SupplierInvoiceCreated

SupplierInvoiceApproved

SupplierInvoicePosted

PurchaseReturned

=========================================================
SALES DOMAIN EVENTS
=========================================================

Generate events:

QuotationCreated

SalesOrderCreated

SalesOrderApproved

SalesOrderCancelled

InventoryReservedForOrder

InventoryAllocatedForOrder

DispatchCreated

InventoryPickedForDispatch

InventoryDispatched

InvoiceCreated

InvoicePosted

SalesReturned

=========================================================
ACCOUNTING DOMAIN EVENTS
=========================================================

Generate events:

AccountCreated

JournalCreated

JournalPosted

JournalReversed

PaymentCreated

PaymentPosted

ReceiptCreated

ReceiptPosted

=========================================================
AUDIT EVENTS
=========================================================

Generate events:

AuditLogCreated

UserLoggedIn

UserLoggedOut

PermissionGranted

PermissionRevoked

=========================================================
NOTIFICATION EVENTS
=========================================================

Generate events:

NotificationCreated

EmailSent

SmsSent

PushNotificationSent

=========================================================
LISTENER RULES
=========================================================

Generate listeners for:

Inventory updates

Accounting postings

Audit logs

Notifications

Statistics updates

Cache invalidation

=========================================================
PURCHASE EVENT FLOW
=========================================================

Example:

PurchaseOrderApproved

        ↓

Generate listeners:

CreateAuditLog

SendNotification

UpdatePurchaseStatistics

=========================================================
GRN EVENT FLOW
=========================================================

Example:

GRNApproved

        ↓

CreateInventoryObjects

CreateInventoryMovements

UpdateInventorySnapshot

PostAccountingEntry

CreateAuditLog

SendNotification

=========================================================
SALES EVENT FLOW
=========================================================

Example:

SalesOrderApproved

        ↓

ReserveInventory

AllocateInventory

UpdateReservationStatus

CreateAuditLog

=========================================================
DISPATCH EVENT FLOW
=========================================================

Example:

InventoryDispatched

        ↓

ReduceInventory

UpdateSnapshots

PostAccountingEntries

GenerateInvoice

AuditDispatch

=========================================================
ACCOUNTING EVENT FLOW
=========================================================

Example:

InvoicePosted

        ↓

CreateJournal

UpdateLedger

UpdateReceivables

GenerateAudit

=========================================================
GRANITE EVENT FLOW
=========================================================

Example:

GraniteSlabCut

        ↓

UpdateOriginalSlab

CreateRemnant

UpdateInventory

AuditOperation

=========================================================
QUEUE SUPPORT
=========================================================

Generate queueable listeners.

Examples:

ShouldQueue

Examples:

SendEmailListener

GenerateReportListener

UpdateStatisticsListener

=========================================================
EVENT SUBSCRIBERS
=========================================================

Generate subscribers:

InventoryEventSubscriber

PurchaseEventSubscriber

SalesEventSubscriber

AccountingEventSubscriber

AuditEventSubscriber

NotificationEventSubscriber

=========================================================
EVENT NAMING RULES
=========================================================

Events should be named:

Past tense.

Examples:

Good:

InventoryAllocated
GoodsReceived
InvoicePosted

Bad:

AllocateInventory
ReceiveGoods
PostInvoice

=========================================================
AUDIT TRAIL
=========================================================

Every event should support:

event_id
organization_id
user_id
timestamp
entity_type
entity_id
metadata

=========================================================
OUTPUT FORMAT
=========================================================

For every event generate:

1. Business Purpose
2. Event Class
3. Event Properties
4. Event Payload
5. Event Listeners
6. Queue Support
7. Audit Support
8. Event Subscribers
9. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate a production-grade
event-driven architecture
supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slab inventory
- Tile conversions
- Double-entry accounting
- Event replay
- Audit trails
- Queue processing
- Millions of transactions

Never optimize for CRUD.

Always optimize for:

- Loose coupling
- Domain integrity
- Event sourcing compatibility
- ERP correctness
- Scalability
- Maintainability
