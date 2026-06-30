You are acting as:

- Principal ERP Architect
- Supply Chain Architect
- Warehouse Management Expert
- Inventory Optimization Expert
- Senior Laravel 12 Architect
- Domain Driven Design Expert

Your task is to design and generate
a production-grade Inventory Engine
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
- Future inventory categories

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
INVENTORY PHILOSOPHY
=========================================================

Inventory is NOT a quantity.

Inventory is a collection of
physical business objects.

Examples:

Tiles:

100 boxes

Granite:

BG001
BG002
BG003

Sanitary:

25 pieces

=========================================================
INVENTORY BEHAVIORS
=========================================================

Generate support for:

STANDARD

CONVERTIBLE

SLAB

SERIAL

BATCH

BUNDLE

ROLL

=========================================================
PRODUCT TYPES
=========================================================

Support:

Tiles

Granite

Marble

Quartz

Sanitaryware

CP fittings

Accessories

Adhesives

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

app/

    Domains/

        Inventory/

            Models/

            Services/

            Actions/

            Events/

            Listeners/

            DTOs/

            Policies/

            Enums/

            Repositories/

=========================================================
DATABASE TABLES
=========================================================

Generate schema for:

inventory_objects

inventory_movements

inventory_reservations

inventory_allocations

inventory_snapshots

inventory_transfers

inventory_adjustments

inventory_counts

inventory_valuations

granite_slabs

granite_remnants

=========================================================
INVENTORY OBJECTS
=========================================================

Purpose:

Represent physical inventory.

Examples:

Tile:

100 boxes

Granite:

BG001
BG002
BG003

Sanitary:

25 pieces

Fields:

organization_id

product_variant_id

inventory_behavior

object_code

quantity

area

weight

warehouse_id

storage_location_id

status

metadata

=========================================================
INVENTORY MOVEMENTS
=========================================================

Movement Types:

PURCHASE

SALE

RETURN

TRANSFER

ADJUSTMENT

DAMAGE

SCRAP

RESERVATION

ALLOCATION

REALLOCATION

DISPATCH

RECEIPT

=========================================================
MOVEMENT PHILOSOPHY
=========================================================

All inventory changes
must be recorded using:

inventory_movements.

Never update inventory
without recording movement.

=========================================================
TILE INVENTORY
=========================================================

Inventory Behavior:

CONVERTIBLE

Examples:

Tile A

1 BOX = 4 PIECES

1 PIECE = 4 SQFT

Internal stock:

400 pieces

Display:

98 boxes + 2 pieces

Support:

BOX

PIECE

SQFT

Conversions.

=========================================================
TILE SALES
=========================================================

Examples:

Customer buys:

3 pieces

ERP:

Convert

BOX → PIECE

Adjust inventory.

=========================================================
GRANITE INVENTORY
=========================================================

Inventory Behavior:

SLAB

Examples:

BG001

BG002

BG003

Every slab:

unique.

Fields:

slab_no

length

width

thickness

finish

origin

area

weight

status

=========================================================
GRANITE STORAGE
=========================================================

Support:

Granite Yard

Stand

Rack

Stack

Location

Examples:

G01

G02

G03

=========================================================
GRANITE TRANSFER
=========================================================

Example:

BG001

Main Yard

        ↓

Display Area

Movement recorded.

=========================================================
GRANITE ALLOCATION
=========================================================

Customer:

25 sqft

ERP asks:

Select slab.

Example:

BG001

Allocation occurs by slab.

=========================================================
GRANITE CUTTING
=========================================================

Example:

BG001

60 sqft

After cut:

BG001

20 sqft

BG001-R1

15 sqft

BG001-R2

25 sqft

=========================================================
GRANITE REMNANTS
=========================================================

Generate support:

remnant_of_id

remaining_area

usable

status

=========================================================
SANITARY INVENTORY
=========================================================

Inventory Behavior:

STANDARD

Examples:

Wash Basin

WC

Urinal

Support:

piece-based inventory.

=========================================================
RESERVATION ENGINE
=========================================================

Generate:

inventory_reservations

Support:

SOFT reservation

HARD reservation

Expiry

Release

Convert to allocation

=========================================================
ALLOCATION ENGINE
=========================================================

Generate:

inventory_allocations

Support:

allocate()

reallocate()

release()

complete()

=========================================================
PICKING ENGINE
=========================================================

Support:

Picking List

Picker

Warehouse

Location

Status

=========================================================
TRANSFER ENGINE
=========================================================

Support:

Warehouse Transfer

Branch Transfer

Location Transfer

Granite Transfer

Tile Transfer

=========================================================
ADJUSTMENT ENGINE
=========================================================

Support:

Positive Adjustment

Negative Adjustment

Stock Correction

Damage

Scrap

=========================================================
PHYSICAL STOCK COUNT
=========================================================

Generate:

inventory_counts

Support:

Cycle Count

Annual Count

Blind Count

Variance Calculation

Approval Workflow

=========================================================
VALUATION METHODS
=========================================================

Generate support:

FIFO

LIFO

Weighted Average

Moving Average

Specific Identification

=========================================================
GRANITE VALUATION
=========================================================

Support:

Per slab valuation.

Example:

BG001

₹40,000

BG002

₹55,000

=========================================================
INVENTORY SNAPSHOTS
=========================================================

Generate:

daily snapshot

monthly snapshot

yearly snapshot

=========================================================
WAREHOUSE MANAGEMENT
=========================================================

Support:

Warehouse

Zone

Aisle

Rack

Shelf

Bin

Stand

Yard

=========================================================
LOT/BATCH MANAGEMENT
=========================================================

Support:

batch_no

lot_no

manufacturing_date

expiry_date

=========================================================
SERIAL MANAGEMENT
=========================================================

Support:

serial_no

activation_date

warranty_date

=========================================================
INVENTORY EVENTS
=========================================================

Generate:

InventoryCreated

InventoryAdjusted

InventoryReserved

InventoryReleased

InventoryAllocated

InventoryTransferred

InventoryDamaged

InventoryScrapped

InventoryCountCompleted

GraniteSlabCreated

GraniteSlabCut

GraniteRemnantCreated

=========================================================
INVENTORY SERVICES
=========================================================

Generate:

InventoryService

ReservationService

AllocationService

TransferService

AdjustmentService

ValuationService

GraniteService

InventoryCountService

=========================================================
INVENTORY API
=========================================================

Generate APIs:

/inventory

/inventory/transfers

/inventory/adjustments

/inventory/reservations

/inventory/allocations

/inventory/counts

/granite/slabs

/granite/remnants

=========================================================
INVENTORY REPORTS
=========================================================

Generate:

Stock Report

Stock Ledger

Stock Valuation

Inventory Aging

Inventory Movement

Granite Slab Report

Granite Remnant Report

Inventory Reservation Report

Inventory Allocation Report

=========================================================
INVENTORY UI
=========================================================

Generate React modules:

InventoryDashboard

InventoryTransfer

InventoryAdjustment

InventoryCount

InventoryReservation

InventoryAllocation

GraniteSlabManagement

GraniteRemnantManagement

StockLedger

StockValuation

=========================================================
PERFORMANCE
=========================================================

Implement:

Indexes

Snapshots

Caching

Aggregate Tables

Background Jobs

Partitioning

Avoid:

Full table scans

Heavy joins

=========================================================
SECURITY
=========================================================

Support:

Branch restrictions

Warehouse restrictions

Inventory permissions

Approval workflow

=========================================================
AUDIT TRAIL
=========================================================

Track:

who

when

what

before

after

reason

device

ip address

=========================================================
OUTPUT FORMAT
=========================================================

For every component generate:

1. Business Purpose
2. Database Schema
3. Laravel Models
4. Services
5. Events
6. APIs
7. React Modules
8. Reports
9. Security
10. Audit
11. Performance Optimization
12. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate an enterprise-grade
inventory engine supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Tiles
- Granite slabs
- Marble
- Sanitaryware
- Reservations
- Allocations
- Remnants
- Transfers
- Inventory valuation
- Physical stock count
- Millions of inventory records

Never optimize for CRUD.

Always optimize for:

- Inventory correctness
- Warehouse efficiency
- ERP architecture
- Auditability
- Performance
- Scalability
