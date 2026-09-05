Redesign the Inventory page at /inventory for the Tiles & Sanitaryware ERP.

IMPORTANT:

- This is a redesign of the existing project, not a request to build a separate inventory system.
- First inspect the entire existing codebase and understand the current Inventory domain, React components, routes, controllers, services, models, API responses, migrations, GRN integration, inventory movements, warehouses, storage locations, reservations, stock adjustments, stock counts, and granite/slab handling.
- Preserve the existing architecture and reuse existing functionality wherever appropriate.
- Do not introduce duplicate inventory concepts or a second stock-entry mechanism.
- Do not implement Purchase Orders as part of this task.
- Do not expose internal/technical concepts to normal shop staff.

BUSINESS CONTEXT

This ERP is for a tiles and sanitaryware retail/wholesale business.

Typical products include:

- Floor Tiles
- Wall Tiles
- Vitrified Tiles
- Porcelain Tiles
- Granite
- Marble
- Sanitaryware
- Wash Basins
- Toilets/WCs
- Bathroom fittings
- Other building-material products

The primary inventory question for a user is:

"What stock do we have, where is it, and how much is available?"

The Inventory page should therefore be a practical stock-management screen rather than an "enterprise inventory engine" or technical inventory-object dashboard.

==================================================

1. # REDESIGN THE MAIN /inventory PAGE

Replace the current overly technical inventory presentation with a clean, business-oriented Inventory page.

Page heading:

Inventory

Subtitle:

View and manage current stock across warehouses and storage locations.

The primary view should be STOCK.

Do not make the page primarily about:

- Inventory Objects
- Inventory Behavior
- Valuation methods
- Allocation engines
- Internal stock algorithms
- Technical audit terminology

================================================== 2. MAIN INVENTORY LAYOUT
==================================================

Use this general structure:

Inventory
View and manage current stock across warehouses and storage locations.

[ Refresh ] [ Actions ▼ ]

Summary cards:

[ Total Stock ]
[ Available Stock ]
[ Reserved Stock ]
[ Low Stock ]

Then filters:

[ Warehouse ▼ ]
[ Category ▼ ]
[ Stock Status ▼ ]
[ Search product, SKU, barcode... ]

Then the main stock table.

Use Bootstrap 5 and the existing application's visual language. Keep the interface clean, compact, responsive and suitable for desktop shop/warehouse staff.

Do not introduce unnecessary visual decoration.

================================================== 3. STOCK SUMMARY CARDS
==================================================

Show useful inventory summaries.

At minimum:

Total Stock
Available Stock
Reserved Stock
Low Stock

Use business-friendly terminology.

Do not expose internal terms such as:

- Inventory Object
- Inventory Behavior
- STANDARD
- CONVERTIBLE
- SPECIFIC_ID
- FIFO
- LIFO
- WAC

If the existing backend cannot calculate one of these summaries correctly, inspect the existing inventory architecture and implement the smallest appropriate backend/API improvement rather than displaying misleading values.

================================================== 4. STOCK TABLE
==================================================

The main table should represent STOCK, not raw inventory objects.

Recommended columns:

Product
SKU
Warehouse
Location
On Hand
Reserved
Available
Unit
Status
Actions

Example:

Kajaria Royal Gold 600 × 600 mm
SKU: KAJ-001

Main Warehouse
A-01

120 Box
20 Box
100 Box

In Stock

Another example:

Simpolo ORO BIANCO 600 × 1200 mm
SKU: SIM-OB-612

Main Warehouse
A-02

40 Box
0 Box
40 Box

In Stock

For sanitaryware:

Cera Wash Basin
SKU: CER-WB-001

Showroom
S-03

18 Pieces
2 Pieces
16 Pieces

In Stock

For granite:

Black Galaxy Granite
SKU: BG-001

Granite Yard
G-01

7 Slabs
1 Slab
6 Slabs

In Stock

The exact unit labels must come from the existing product/unit architecture. Do not hard-code units.

================================================== 5. PRODUCT PRESENTATION
==================================================

Make product names the primary information.

If useful, show a small secondary line below the product name for product details.

Examples:

Kajaria Royal Gold
600 × 600 mm

Simpolo ORO BIANCO
600 × 1200 mm

Cera Wall Hung WC
White

Black Galaxy Granite
Granite slab

Do NOT add a generic "Type / Specs" column.

Do NOT expose "Product Type", "Inventory Behavior", "Custom Attributes", "Attribute Definition", etc.

The existing Product Details/category configuration should remain responsible for product-specific information.

================================================== 6. FILTERS
==================================================

Implement practical filters.

Warehouse:

- All Warehouses
- Existing organization warehouses loaded dynamically

Category:

- Existing categories loaded dynamically

Stock Status:

- All
- In Stock
- Low Stock
- Out of Stock

Search:
Support searching by relevant product identifiers such as:

- Product name
- SKU
- Barcode
- GTIN if supported by the existing product model
- Batch number where appropriate

Do not hard-code warehouse IDs or names.

Use the current authenticated organization/tenant context.

================================================== 7. STOCK CALCULATION
==================================================

Use the existing inventory architecture and inspect how current stock is calculated.

The UI should distinguish:

On Hand
Reserved
Available

Conceptually:

Available = On Hand - Reserved

However, use the existing domain rules/services if they already define these quantities.

Do not duplicate stock-calculation logic in React.

Stock calculations must be performed by the backend/domain layer.

Do not make the React application independently calculate authoritative stock.

================================================== 8. IMPORTANT: PRODUCT-LEVEL STOCK, NOT INVENTORY-OBJECT LISTING
==================================================

The current implementation exposes InventoryObject data too directly.

Redesign the API/data presentation so that the primary inventory list represents aggregated stock such as:

Product

- Warehouse
- Storage Location
- Batch where applicable

rather than simply rendering every InventoryObject as a row.

For ordinary tiles and sanitaryware, users should see something like:

Kajaria Royal Gold
Main Warehouse / A-01
120 Box

not a list of internal BULK inventory objects.

Reuse InventoryObject internally where the existing architecture requires it.

Do not unnecessarily delete or rewrite the existing InventoryObject domain.

================================================== 9. GRANITE / MARBLE SLAB HANDLING
==================================================

Granite slabs are different from ordinary bulk tile/sanitary stock.

Preserve the existing slab functionality and existing slab-related domain models/services.

Do not force slab-specific details into the normal stock table.

For a granite/marble product, the stock summary can show:

Black Galaxy Granite
7 Slabs
52.75 sq.ft.

Then allow:

[ View Details ]

The detail view should show individual slabs when applicable.

Example:

Slab Code | Size | Area | Location | Status

SLAB-001
8 × 4 ft
32.00 sq.ft.
G-01
Available

SLAB-002
7 × 4 ft
28.00 sq.ft.
G-01
Available

SLAB-003
6 × 4 ft
24.00 sq.ft.
G-02
Reserved

Reuse the existing granite/slab functionality rather than creating another slab system.

================================================== 10. STOCK DETAILS
==================================================

Clicking a stock row or "View Details" should open a dedicated stock-detail view, drawer, or modal consistent with the application's architecture.

Show:

Product name
SKU
Category
Relevant product details

Stock Summary:

On Hand
Reserved
Available

Warehouse Stock:

Warehouse
Storage Location
Quantity
Unit

Packaging information where applicable:

Example:

1 Box = 4 Pieces

Use the current Product Pricing & Packaging architecture.

Do not create packaging data inside Inventory if it already belongs to Product Pricing & Packaging.

================================================== 11. RECENT STOCK ACTIVITY
==================================================

Inside Stock Details, show recent inventory activity.

Example:

02 Sep GRN-00145 Receipt +50 Box
01 Sep INV-00291 Sale -5 Box
30 Aug TRF-00008 Transfer -20 Box

Use the existing inventory_movements architecture.

References such as:

GRN-00145
INV-00291
TRF-00008

should be clickable where the corresponding routes/pages already exist.

The inventory history must remain traceable to the original business transaction.

================================================== 12. STOCK HISTORY
==================================================

Provide a secondary "Stock History" view.

Do not make it the default page.

It should display inventory movements in a simple ledger-style table:

Date
Product
Movement
Quantity
Warehouse
Reference
User where appropriate

Examples of movement labels should be business-friendly:

Receipt
Sale
Transfer
Return
Adjustment
Damage
etc.

Do not expose internal implementation terminology unnecessarily.

Use the existing inventory_movements table/domain.

================================================== 13. ACTIONS MENU
==================================================

Do not put every operational function permanently on the main screen.

Provide:

[ + Actions ▼ ]

with appropriate existing actions such as:

Transfer Stock
Adjust Stock
Stock Count

Reservations may remain accessible where required by the existing business workflow.

Do NOT add:

"Add Stock"

The normal way purchased stock enters inventory must remain:

GRN
→ Receive/Accept
→ Inventory

Do not create a second manual stock-entry mechanism.

================================================== 14. GRN INTEGRATION
==================================================

Preserve the existing GRN → Inventory architecture.

A posted/approved GRN should automatically create/update inventory according to the existing domain rules.

Inventory users should not manually enter the same received stock again.

Only accepted GRN quantity should affect available inventory, according to the existing implementation.

Do not redesign the GRN module as part of this task unless a minimal API integration change is required for the Inventory page.

================================================== 15. TRANSFER STOCK
==================================================

Move transfer functionality behind:

Actions → Transfer Stock

Use actual organization warehouses dynamically.

Do not hard-code values such as:

Main Slab Depot (W1)
Sanitary & Tiles Loft (W2)

The transfer UI should allow:

From Warehouse
To Warehouse
Product
Available Quantity
Quantity to Transfer
Destination Location where supported
Reason/remarks where supported

Use the existing transfer/inventory movement implementation.

================================================== 16. STOCK ADJUSTMENT
==================================================

Move adjustment functionality behind:

Actions → Adjust Stock

The form should be simple:

Warehouse
Product
Current Stock
Adjustment
Reason
Remarks

Show the resulting stock clearly before submission if appropriate.

Use the existing adjustment/domain logic.

Do not allow the React UI to directly manipulate inventory quantities.

================================================== 17. STOCK COUNT
==================================================

Rename the user-facing concept from "Cycle Audit" to:

Stock Count

if this does not conflict with existing domain terminology.

The workflow should be understandable to warehouse staff.

Example:

Warehouse: Main Warehouse

Product
System Quantity
Counted Quantity
Difference

Then allow reconciliation through the existing inventory-count functionality.

================================================== 18. VALUATION
==================================================

Do not make valuation a primary tab on the Inventory page.

If the existing valuation functionality must remain accessible, move it to an appropriate secondary location such as:

Reports
or
Stock Details / Valuation

Do not expose technical valuation method names such as FIFO/LIFO/WAC to ordinary inventory users unless the existing application explicitly requires them.

Do not remove working valuation backend functionality merely because it is removed from the primary UI.

================================================== 19. RESERVATIONS
==================================================

Do not make "Reserve & Allocate" a dominant primary Inventory tab.

Reservations should be visible where useful, especially in Stock Details:

On Hand: 40 Box
Reserved: 8 Box
Available: 32 Box

Then show reservation information where the existing business workflow supports it.

Preserve the existing reservation functionality.

================================================== 20. LOW STOCK / OUT OF STOCK
==================================================

Provide clear visual status:

In Stock
Low Stock
Out of Stock

Do not invent arbitrary thresholds.

Inspect the existing project for reorder/stock threshold configuration.

If no threshold exists, implement the UI in a way that does not pretend a threshold exists. Do not silently hard-code business rules.

================================================== 21. ORGANIZATION / TENANT ISOLATION
==================================================

This is a multi-tenant application.

Every inventory query and mutation must remain scoped to the authenticated organization according to the existing architecture.

Never allow one organization to see:

- Products
- Inventory
- Warehouses
- Locations
- Stock movements
- Reservations

belonging to another organization.

Preserve the existing authorization and permission model.

Do not solve tenant isolation only in React.

================================================== 22. RESPONSIVE UX
==================================================

The application is primarily a desktop ERP, but the page should remain usable on smaller screens.

On desktop:

- summary cards in one row
- filters in one compact toolbar
- stock table

On smaller screens:

- filters may wrap
- table may scroll horizontally
- avoid breaking important information

Do not turn the ERP into a mobile-first card-only interface.

================================================== 23. REMOVE / HIDE CURRENT TECHNICAL UI
==================================================

The redesign should remove or hide from the normal Inventory page:

- "Enterprise Inventory Control Engine"
- Inventory Object terminology
- Inventory Behavior
- STANDARD / CONVERTIBLE etc.
- Raw inventory-object identifiers
- Technical allocation terminology where not necessary
- Technical valuation methods
- Generic Type / Specs column
- Hard-coded warehouse options
- Excessive dashboard panels
- Permanent large forms for every inventory operation

The UI should use business language suitable for a tiles/sanitaryware retail shop.

================================================== 24. DO NOT BREAK EXISTING DOMAIN FUNCTIONALITY
==================================================

Before modifying anything, inspect:

- InventoryManager.jsx
- SlabInventoryView.jsx
- inventory routes
- inventory controllers
- InventoryService
- inventory models
- inventory movement implementation
- reservation implementation
- adjustment implementation
- inventory count implementation
- granite/slab implementation
- warehouse/location implementation
- GRN implementation
- product/product variant implementation
- product pricing & packaging implementation
- relevant migrations
- API resources/transformers
- authorization/policies/permissions

Reuse existing services and domain rules.

Do not move business logic into React.

================================================== 25. API DESIGN
==================================================

If the existing inventory API returns raw InventoryObject records and is insufficient for the new UI, introduce an appropriate stock-summary API or modify the existing API carefully.

The API should conceptually provide:

product
sku
category
warehouse
storage_location
on_hand_quantity
reserved_quantity
available_quantity
unit
area where applicable
status

Do not expose unnecessary internal implementation fields.

Pagination should be handled by the backend.

Filtering/searching should be handled by the backend rather than loading the entire inventory into React.

================================================== 26. DATABASE CHANGES
==================================================

Do NOT blindly modify migrations.

First determine whether the existing database schema can support the redesigned inventory view.

Only introduce a migration if a genuine domain/data requirement is missing.

Do not create redundant stock tables merely because the UI needs an aggregated view.

Prefer deriving current stock from the existing inventory architecture where it is reliable.

If a stock-summary/read-model is genuinely necessary, explain why before implementing it and ensure it remains consistent with inventory movements.

================================================== 27. FINAL TARGET UX
==================================================

The final user experience should feel approximately like:

Inventory

View and manage current stock across warehouses and storage locations.

[ Refresh ] [ + Actions ▼ ]

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Stock │ │ Available │ │ Reserved │ │ Low Stock │
│ │ │ │ │ │ │ │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

[ All Warehouses ▼ ]
[ All Categories ▼ ]
[ All Status ▼ ]
[ Search product, SKU, barcode... ]

STOCK

Product Warehouse / Location On Hand Reserved
──────────────────────────────────────────────────────────────────────
Kajaria Royal Gold Main / A-01 120 Box 20 Box
600 × 600 mm

Simpolo ORO BIANCO Main / A-02 40 Box 0 Box
600 × 1200 mm

Cera Wash Basin Showroom / S-03 18 Pcs 2 Pcs

Black Galaxy Granite Slab Yard / G-01 7 Slabs 1 Slab
52.75 sq.ft.

                                      [View Details]

================================================== 28. IMPLEMENTATION REQUIREMENT
==================================================

Do not simply redesign the JSX visually.

First study the existing project and determine:

1. How current inventory stock is represented.
2. How ordinary tile/sanitary stock differs from granite slab stock.
3. How GRN creates inventory.
4. How inventory movements update stock.
5. How reservations affect available stock.
6. How warehouses and storage locations are represented.
7. How the current API calculates/returns stock.
8. Which existing services should be reused.
9. Which API changes are actually necessary.
10. Whether any database changes are necessary.

Then implement the redesign.

The result must be a real working Inventory page integrated with the existing backend, not mocked/static data.

================================================== 29. IMPORTANT DESIGN PRINCIPLE
==================================================

The final design must clearly separate these concepts:

PRODUCT
"What is the item?"

STOCK
"How much do we currently have and where?"

MOVEMENT
"Why did the stock change?"

PHYSICAL SLAB
"For granite/marble, which actual slab is it?"

Do not expose these internal domain distinctions unnecessarily to ordinary users, but preserve them correctly in the backend.

The Inventory page should ultimately answer the shop user's questions immediately:

- What products do we have?
- How much do we have?
- Where is it?
- How much is reserved?
- How much is available?
- Is it low/out of stock?
- What happened to the stock recently?
- How can I transfer, adjust, or count it?

Implement the redesign while preserving existing business rules, tenant isolation, authorization, GRN integration, inventory movements, and granite/slab functionality.
