# Tiles & Sanitary Management System

A comprehensive business management and ERP system designed for
tile, sanitaryware, granite, marble, CP fittings, accessories, and
other building-material businesses.

The primary objective of this project is to computerise the complete
business lifecycle of a shop, wholesaler, retailer, or other
building-material organisation — starting from procurement from
suppliers, continuing through receiving and inventory management, and
finally ending with sales and business reporting.

---

## 1. Project Vision

The core idea of this system is simple:

> Manage the complete flow of goods through a business in one
> integrated system.

Instead of maintaining separate systems for purchasing, stock,
sales, and business records, this application brings these activities
together.

The overall business flow is:

```text
                    PROCUREMENT
                         │
                         ▼
                    SUPPLIER
                         │
                         ▼
                PURCHASE ORDER
                         │
                         ▼
              GOODS RECEIVED (GRN)
                         │
                         ▼
                     INVENTORY
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
          TRANSFER               ADJUSTMENT
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
                       SALES
                         │
                         ▼
                    CUSTOMER
                         │
                         ▼
                   SALES REPORTS
```

## 2. Target Businesses

The system is primarily designed for businesses dealing in:

> Tiles
> Sanitaryware
> Granite
> Marble
> CP fittings
> Bathroom accessories
> Building-material accessories
> Other related products

The system is designed to work for:

> Retail shops
> Wholesale businesses
> Retail + wholesale businesses
> Multiple-branch businesses
> Small and medium-sized building-material businesses

The architecture is designed with future expansion toward larger
multi-branch and multi-organization deployments in mind.

## 3. Core Business Lifecycle

The central business lifecycle is:

```text

Supplier
   │
   ▼
Purchase
   │
   ▼
Goods Receiving
   │
   ▼
Inventory
   │
   ├── Stock Transfer
   ├── Stock Adjustment
   ├── Stock Reservation
   └── Stock Movement
   │
   ▼
Sales
   │
   ▼
Customer

```

Every major movement of goods should ultimately be represented by a
business transaction.

This creates a traceable chain from:

> Purchase → Receipt → Stock → Sale

## 4. Procurement Management

The procurement module manages purchasing goods from external
suppliers.

The current system treats the Purchase Order as the primary purchasing
document.

The current design intentionally does not make Purchase Requisition
part of the active purchasing workflow.

The simplified purchasing flow is:

User
│
▼
Purchase Order
│
▼
Supplier
│
▼
Goods Delivery
│
▼
GRN
│
▼
Inventory

A Purchase Order records the organisation's intention to purchase goods
from a supplier.

A Purchase Order may contain:

Supplier
Branch
PO number
PO date
Expected delivery date
Reference number
Payment terms
Delivery terms
Products
Quantities
Units
Rates
Discounts
Taxes
Total amount
Remarks
Status 5. Purchase Order Status

Purchase Orders are stateful business documents.

The system supports statuses such as:

DRAFT
SUBMITTED
APPROVED
SENT
PARTIALLY_RECEIVED
FULLY_RECEIVED
CLOSED
CANCELLED

The exact approval mechanism can evolve as the system grows.

The current design intentionally avoids imposing a complex workflow
engine because different organisations may have different procurement
approval requirements.

The system should therefore keep the basic purchasing lifecycle
simple and extensible.

6. Goods Receipt Note (GRN)

A Goods Receipt Note represents the actual receipt of goods from a
supplier.

The normal flow is:

Purchase Order
│
▼
Supplier delivers goods
│
▼
GRN
│
▼
Inventory

The GRN is important because a Purchase Order represents what was
ordered, whereas the GRN represents what was actually received.

For example:

PO:
100 BOX Tiles

GRN:
60 BOX received

Remaining:
40 BOX

The system can therefore maintain:

Ordered Quantity
Received Quantity
Remaining Quantity 7. GRN Without Purchase Order

The system may also support receiving goods without a Purchase Order.

However, this should be treated as an explicit exception rather than
the normal receiving workflow.

Conceptually:

Normal:

Purchase Order
↓
GRN
↓
Inventory

Exception:

Supplier Delivery
↓
Direct GRN
↓
Inventory

A direct GRN should be clearly identified as a receipt without PO and
should require an appropriate reason and permissions.

This provides flexibility for:

Emergency purchases
Small purchases
Goods received before PO entry
Replacement goods
Other exceptional circumstances

while preserving the normal procurement audit trail.

8. Inventory Management

Inventory is one of the core components of the system.

The objective is not merely to store a current stock number.

The system should maintain the history of stock movement.

Conceptually:

Opening Stock +
Purchases / GRNs +
Stock Transfers In +
Adjustments In -
Sales -
Stock Transfers Out -
Adjustments Out
=
Current Stock

Inventory should therefore be based on stock movements and transaction
history rather than relying solely on manually edited quantities.

9. Multiple Product Measurement Models

One of the major challenges of this domain is that different products
are purchased, stored, priced, and sold using different units.

The system therefore distinguishes between:

Product specifications
Measurement units
Transaction units
Pricing units
Product-specific conversions

These concepts must not be mixed.

10. Units of Measurement (UOM)

The system recognises different measurement dimensions.

Length
MM
CM
M
IN
FT
Area
SQ.MM
SQ.M
SQ.IN
SQ.FT
Volume
CU.MM
CU.CM
CU.M
CU.FT
Mass
G
KG
TON
Count
PCS
BOX
BAG
SET
SLAB

Not all units are universally convertible.

For example:

FT ↔ MM

is a valid length conversion.

SQ.FT ↔ SQ.M

is a valid area conversion.

But:

MM ↔ SQ.FT

is not a direct UOM conversion because length and area are different
dimensions.

11. Product-Specific Unit Conversion

Some conversions are not universal.

For example:

1 BOX = 4 PCS

may be true for one tile product.

Another product may have:

1 BOX = 2 PCS

Therefore:

BOX → PCS

is a product-specific commercial conversion rather than a universal
UOM conversion.

This distinction is important for accurate purchasing, inventory, and
sales calculations.

12. Tiles

Tiles commonly have fixed physical dimensions and are commonly
purchased by boxes.

For example:

Product:
600 × 600 mm Tile

Physical dimensions:
Length = 600 MM
Width = 600 MM
Thickness = 8 MM

Purchase Unit:
BOX

Contents:
4 PCS / BOX

The system should be capable of understanding the relationship between:

BOX
PCS
Physical dimensions
Coverage area
Price

without incorrectly treating all boxes as having the same number of
pieces.

13. Granite and Marble

Granite and marble require a different inventory model.

They may be sold based on area:

₹180 / SQ.FT.

but physically received as individual slabs.

For example:

Slab #1
120 IN × 72 IN
≈ 60 SQ.FT.

Slab #2
118 IN × 70 IN
≈ 57.36 SQ.FT.

Therefore:

1 SLAB

does not necessarily represent a fixed area.

The actual dimensions and area of individual slabs may need to be
captured during Goods Receiving.

This distinction is essential:

Purchase Quantity:
SLABS

Pricing:
SQ.FT.

Actual inventory:
Individual slabs with actual dimensions/area

The system should not assume:

1 SLAB = 60 SQ.FT.

unless that relationship is actually known for a particular slab.

14. Product Catalog

The Product Catalog is the foundation of purchasing, inventory, and
sales.

A Product represents the actual item that the organisation buys,
stocks, and sells.

Products contain information such as:

Product name
Category
Brand
Manufacturer
Product type
SKU
GTIN
Tax profile
Units
Pricing
Specifications
Inventory configuration

The system intentionally does not use the previously considered
Product Family concept.

15. Product Family Removal

The Product Family concept was removed to simplify the product
catalogue.

The system instead focuses on:

Category
Brand
Manufacturer
Product
Product Specifications

This avoids ambiguity where a Product Family could belong to one Brand
while the Product itself belonged to another Brand.

Brand is a direct property of the Product.

16. Product Type

Products currently follow two broad types:

STANDARD
MEASURED_MATERIAL
STANDARD

Used for products that normally have a relatively consistent unit
and quantity model.

Examples:

Tiles
Sanitaryware
Accessories
Fittings
MEASURED_MATERIAL

Used for materials where physical dimensions and actual measurements
may vary.

Examples:

Granite
Marble
Other slab-based materials

This distinction helps the system determine how inventory and receiving
should behave.

17. Product Specifications / Custom Attributes

Product Specifications are optional.

A product does not need to have custom attributes.

For example:

Product A

Specifications:
None

is completely valid.

Another product may have:

Length = 600 MM
Width = 600 MM
Thickness = 8 MM
Color = White
Finish = Glossy

The system therefore allows each Product to have only the
specifications relevant to it.

18. Attribute Definitions

Attributes are reusable definitions.

Examples:

Length
Width
Thickness
Color
Finish
Material
Weight
Volume

An organisation can define an Attribute once and use it for multiple
Products.

However, an Attribute Definition is not automatically assigned to
every Product.

The relationship is:

Attribute Definition
↓
Product-specific Attribute Value

For example:

Thickness
│
├── Product A = 8 MM
├── Product B = 10 MM
└── Product C = 12 MM 19. Optional Attribute Units

An Attribute may have a Unit or may explicitly have:

NO UNIT

Examples:

Thickness
Numeric
MM

Length
Numeric
FT

Volume
Numeric
CU.M

Color
List
NO UNIT

Finish
List
NO UNIT

Attribute Units describe the Product specification.

They are not the same as:

Purchase Unit
Sales Unit
Stock Unit
Pricing Unit

For example:

Thickness = 8 MM
Purchase Unit = BOX
Price = ₹800 / BOX

These are three separate concepts.

20. Removing Product Attributes

If an Attribute is assigned to a Product, the user can remove it from
that Product.

For example:

Thickness = 8 MM [Remove]

Removing the Attribute means:

Remove Thickness from this Product.

It does NOT mean:

Delete the Thickness Attribute Definition from the system.

The same Attribute may continue to be used by other Products.

21. Manufacturer

Manufacturer is treated as an independent real-world entity.

A Manufacturer does not belong to an organisation.

The system therefore treats Manufacturer as a global master.

For example:

Kajaria Ceramics Limited

may be referenced by Products belonging to multiple organisations.

Conceptually:

Manufacturer
▲
│
│ manufacturer_id
│
Product
│
│ organization_id
▼
Organization

The Manufacturer itself has no:

organization_id

and there is no separate:

organization_manufacturers

relationship.

The Product is organisation-specific, while the Manufacturer is an
independent real-world entity.

22. Manufacturer Identity

Manufacturer information may include:

Legal Name
Trade Name
GSTIN
Registration Number
Business Constitution
Address
Phone
Email
Website
Verification Status

Not all fields are necessarily mandatory.

The system should attempt to prevent duplicate Manufacturer records
using reliable business identifiers, particularly GSTIN where
available.

It should not automatically merge businesses solely because their
names look similar.

23. Manufacturer Registration

Currently, an Organization Admin can add a Manufacturer to the global
Manufacturer master.

This does NOT mean the Manufacturer belongs to that Organization.

The intended process is:

Organization Admin
↓
Search Manufacturer
│
├── Existing
│ ↓
│ Select
│
└── Not Found
↓
Add Manufacturer

In the future, authoritative GST/MCA verification can be integrated
to improve Manufacturer identity verification and reduce duplicate
records.

24. Supplier

Supplier is currently treated differently from Manufacturer.

For the current version of the application, Supplier remains
organization-scoped.

An Organization Admin can register Suppliers for their organisation.

The Supplier is then used by purchasing transactions such as:

Purchase Order
GRN
Supplier Invoice
Purchase Return

This is intentionally retained for the current stage of the project.

Future versions may introduce a global Supplier model, supplier
portals, or supplier accounts.

25. Supplier as a Future External Actor

At present, Suppliers do not have application accounts.

The current system is primarily used internally by:

Organization Admin
Organization Staff

Future versions may introduce:

Supplier Account
Supplier Portal
Purchase Order acknowledgement
Supplier quotations
Supplier communication
Supplier document submission

This is intentionally outside the current scope.

26. Authentication and Organization Management

The system is designed as an organization-based ERP.

A user cannot simply create an arbitrary account without an
organization context.

The organization registration process establishes:

Organization +
Organization Owner/Admin

The person registering an organization becomes its initial
administrator.

Subsequent employees/staff are invited by the Organization Owner/Admin.

The staff member receives an invitation and sets their own password.

27. Organization Staff

The system supports staff users who work within an organization.

Staff accounts are created/invited by authorized organization users.

The invited staff member:

Invitation
↓
Accept Invitation
↓
Set Password
↓
Login

The long-term system uses role and permission-based access control
(RBAC) so that users receive only the capabilities appropriate to
their responsibilities.

28. Role-Based Access Control

RBAC means:

User
↓
Role
↓
Permissions

For example:

Organization Admin
├── Manage Products
├── Manage Suppliers
├── Manage Manufacturers
├── Purchase
├── Inventory
└── Reports

Store Staff
├── View Products
├── Receive Goods
└── Manage Stock

The exact role structure can evolve according to business
requirements.

29. Multi-Organization Architecture

The system is designed with organization-level data isolation.

Organization-owned data generally contains:

organization_id

Examples:

Products
Inventory
Purchase Orders
GRNs
Sales
Pricing
Accounting
Branches
Staff

Global entities, where appropriate, are not organization-owned.

For example:

Manufacturer

is a global entity.

This distinction is important for future multi-tenant scalability.

30. Branches

An organization may operate one or more branches.

Conceptually:

Organization
│
├── Branch A
├── Branch B
└── Branch C

Purchasing, receiving, inventory, and sales transactions can therefore
be associated with a particular branch.

This allows the system to evolve from a single-shop operation into a
multi-branch business.

31. Inventory Across Branches

The system should support controlled movement of stock between
locations/branches.

Conceptually:

Branch A
│
│ Stock Transfer
▼
Branch B

Every movement should be traceable.

The system should be capable of answering:

Where did this stock come from?
Where is it currently located?
How much was received?
How much was transferred?
How much was sold?
How much remains? 32. Sales Management

The ultimate purpose of procurement and inventory management is to
support the business's sales activities.

The sales flow is:

Customer
↓
Sales
↓
Inventory Reduction
↓
Sales Record
↓
Business Reporting

When goods are sold, inventory should be reduced according to the
appropriate Product and Unit model.

The system should eventually support the different ways products are
sold:

PCS
BOX
SQ.FT.
SLAB
KG
etc.

depending on the Product.

33. Product Pricing

Pricing must account for the nature of the Product.

Examples:

Tiles
₹800 / BOX
Sanitaryware
₹5,500 / PCS
Granite
₹180 / SQ.FT.

The pricing unit must not be confused with the physical or purchase
unit.

For granite:

Inventory:
Individual Slab

Pricing:
SQ.FT.

For tiles:

Purchase:
BOX

Contents:
4 PCS

Pricing:
BOX

The system therefore requires a well-defined Product-specific unit
and conversion model.

34. Tax Management

Products can be associated with appropriate tax information.

The system contains Product Tax Profile concepts such as:

HSN
CGST
SGST
IGST

Tax calculation should be associated with the appropriate business
transaction rather than hard-coded into the Product interface.

35. Business Documents

The system is built around traceable business documents.

Important documents include:

Purchase Order
Goods Receipt Note
Sales Record
Stock Transfer
Stock Adjustment
Supplier Invoice
Purchase Return

Each document should maintain:

Unique identifier/number
Date
Organization
Branch where applicable
Related party
Products
Quantities
Units
Amounts
Status
Audit information 36. Auditability

A major objective of the system is to make business activity
traceable.

For example, the system should eventually be able to answer:

Why did the stock of Product X increase by 100 units?

Possible answer:

GRN-00042
← Purchase Order PO-00027
← Supplier ABC Distributors
← Received 100 BOX

Likewise:

Why did the stock decrease by 20 units?

Possible answer:

Sale #INV-00128
← Customer XYZ
← 20 PCS sold

This traceability is essential for a serious inventory system.

37. Design Philosophy

The system follows several important design principles.

Simplicity

Do not introduce complex concepts unless they solve a real business
problem.

For example:

Purchase Requisition is currently not required.
Product Family was removed.
Specifications are optional.
GRN without PO is treated as an explicit exception.
Accuracy

Physical quantities, commercial quantities, pricing units, and
inventory units must be represented correctly.

Traceability

Business transactions should create an auditable chain.

Extensibility

The system should be capable of supporting more complex business
processes later without making the current application unnecessarily
complicated.

Multi-Tenant Safety

Organization-specific information must remain isolated.

Real-World Semantics

Database relationships should reflect real-world relationships.

For example:

Manufacturer

is not owned by an Organization merely because an Organization sells
its products.

38. Current Procurement Architecture

The current simplified architecture is:

                         SUPPLIER
                            │
                            │
                            ▼
                     PURCHASE ORDER
                            │
                            │
                            ▼
                           GRN
                            │
                            │
                            ▼
                        INVENTORY
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
             Transfer   Adjustment     Sale
                │           │           │
                └───────────┴───────────┘
                            │
                            ▼
                         CUSTOMER

This is the central operational lifecycle of the ERP.

39. Future Expansion

The architecture is intended to provide a foundation for future
features such as:

Advanced procurement workflows
Purchase Requisitions
Supplier accounts
Supplier portal
Supplier quotation management
Purchase quotation comparison
Automated reorder levels
Low-stock alerts
Multi-branch inventory
Warehouse management
Barcode scanning
GTIN-based product identification
Customer management
Advanced sales management
Returns
Accounting integration
Payment management
Financial reporting
Business dashboards
Mobile applications
External integrations
GST/e-invoice integrations
Manufacturer verification
Supplier verification
Advanced approval workflows

These are future capabilities and should not unnecessarily complicate
the current core system.

40. Long-Term Vision

The long-term goal is to evolve this application into a complete
business operating platform for the building-material industry.

The system should eventually allow a business owner to answer, from
one place:

Procurement
What did we purchase?
From whom?
At what price?
When did we order it?
When was it received?
Inventory
What do we have in stock?
Where is it stored?
How much was received?
How much has been sold?
How much is available?
Which slabs are currently available?
What is the actual area of each slab?
Sales
What did we sell?
To whom?
At what price?
Which products are selling most?
What is the current sales value?
Business
What did we purchase this month?
What did we sell?
What is our current stock value?
Which suppliers do we purchase most from?
Which products generate the most revenue?
Which products are slow-moving?
Which branches are performing better?

The ultimate objective is:

One system that provides a complete and reliable digital representation of the business's movement of goods and money from procurement through inventory to sales.

41. Core Business Principle

The most important principle of the system is:

BUY
↓
RECEIVE
↓
STORE
↓
MOVE
↓
SELL
↓
REPORT

Every stage should be connected.

A Purchase Order should lead to receiving.

A GRN should lead to inventory.

Inventory should be affected by sales and stock movements.

Sales should produce business records and reports.

The result is a connected business system rather than a collection of
independent forms.

42. Project Status

This project is under active development.

The architecture and database are being developed incrementally,
starting with the core business lifecycle and progressively adding
more advanced capabilities.

Current focus areas include:

Organization management
Authentication
Staff management
Role and permission management
Product catalog
Product specifications
Manufacturer master
Supplier management
Purchase Orders
Goods Receipt Notes
Inventory management
Unit of Measurement management
Product-specific unit conversions
Sales management

Features and architecture may continue to evolve as real-world
business requirements are identified.

43. Summary

This project aims to provide a unified ERP platform for
tile, sanitaryware, granite, marble, and related building-material
businesses.

Its central objective is to connect the complete business lifecycle:

Supplier
↓
Purchase
↓
Purchase Order
↓
Goods Receipt
↓
Inventory
↓
Stock Management
↓
Sales
↓
Customer
↓
Reports

while accurately handling the unique characteristics of products such
as:

Tiles → BOX / PCS / coverage
Sanitaryware→ PCS / SET
Granite → SLAB / SQ.FT. / actual dimensions
Marble → SLAB / SQ.FT. / actual dimensions

The system is designed around the principle that business software
should reflect the real-world business rather than forcing every type
of product and transaction into the same simplified data model.

At the same time, unnecessary complexity is deliberately avoided.

The goal is a system that is:

Simple for staff to use
Accurate for inventory
Reliable for purchasing
Practical for sales
Traceable for management
Safe for multi-organization use
Extensible for future requirements

Ultimately:

The system is intended to computerise the complete operational
lifecycle of a building-material business — from purchasing goods
from suppliers, receiving and managing those goods as inventory,
selling them to customers, and producing the information required
to run the business effectively — all within one integrated system.

### A small recommendation for the README

I would put a **shorter version of the business lifecycle near the very top**, immediately after the project description, because that communicates the purpose of the project much faster than a long feature list:

```text
                 TILES & SANITARY ERP


 Supplier
    │
    ▼
 Purchase Order
    │
    ▼
    GRN
    │
    ▼
 Inventory ──────► Stock Transfer / Adjustment
    │
    ▼
   Sales
    │
    ▼
 Customer
    │
    ▼
 Reports & Business Intelligence

Then the detailed sections can explain how each part works.

This framing also captures what I think is the strongest idea behind your project: I am not building separate “Purchase Software”, “Inventory Software”, and “Sales Software”; I am building one connected transaction chain in which each stage feeds the next.
```
