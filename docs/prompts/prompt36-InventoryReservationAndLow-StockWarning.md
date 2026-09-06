Implement the Inventory Reservation and Low-Stock Warning features in the existing Tiles & Sanitary / Building Materials ERP.

IMPORTANT:

- Work within the existing architecture and database design.
- Do not create a parallel inventory system.
- Reuse the existing product, unit, inventory, reservation, warehouse, storage-location, and organization/tenant architecture wherever possible.
- Preserve existing inventory movement/audit behavior.
- Do not expose internal concepts such as Inventory Behavior or InventoryObject to normal users unless technically necessary.
- Follow the existing Laravel 12 / PHP 8.3+, PostgreSQL, React, Bootstrap 5, Sanctum, modular-monolith / DDD architecture.
- Maintain strict organization/tenant isolation and existing RBAC/permission rules.
- Before modifying anything, inspect the existing migrations, models, services, controllers, API routes, React inventory components, and existing ReservationService to determine what can be reused and what actually needs to change.

==================================================

1. # INVENTORY RESERVATION

Add a proper user-facing mechanism for reserving stock.

A reservation means that a specified quantity of currently available stock is temporarily committed, normally for a customer/order, without physically removing that quantity from inventory.

The fundamental stock relationship must be:

Available Stock = On Hand Stock - Reserved Stock

Example:

Product: Kajaria 600×600 Tile
On Hand: 120 Box
Reserved: 30 Box
Available: 90 Box

The reservation must NOT reduce physical On Hand stock.

---

## 1.1 Reservation UI

On the Inventory page, provide a clear action:

Actions → Reserve Stock

Also allow reservation from a product/stock detail view.

Create a clean reservation form with:

- Product
- Warehouse
- Storage Location, where applicable
- Quantity
- Unit
- Customer, where applicable
- Optional quotation / sales order reference
- Reservation date
- Expiry date
- Optional remarks

When selecting a product:

- Show current On Hand stock.
- Show current Reserved stock.
- Show current Available stock.
- Show the product's appropriate unit.
- Prevent the user from entering a quantity greater than Available Stock.

Examples:

Tile:
120 Box On Hand
30 Box Reserved
90 Box Available

Sanitaryware:
18 Pieces On Hand
3 Pieces Reserved
15 Pieces Available

Adhesive:
40 Bags On Hand
10 Bags Reserved
30 Bags Available

Granite:
7 Slabs On Hand
2 Slabs Reserved
5 Slabs Available

Do not display a bare numeric quantity without its unit.

---

## 1.2 Reservation validation

Reservation creation must be performed transactionally on the backend.

The frontend availability value is informational only.

At commit time, the backend MUST recalculate/verify the current available stock and reject the reservation if:

requested_quantity > available_quantity

This must protect against concurrent users attempting to reserve the same stock simultaneously.

Do not rely solely on React-side validation.

---

## 1.3 Reservation lifecycle

Reservations should support statuses such as:

- ACTIVE
- FULFILLED
- CANCELLED
- EXPIRED

A reservation should contain enough information to determine:

- who created it
- what product was reserved
- where it was reserved
- how much was reserved
- which unit was used
- which customer/order it relates to
- when it was created
- when it expires
- its current status

If the existing reservation tables/models/services already provide this functionality, extend/refactor them rather than creating duplicate structures.

---

## 1.4 Reservation and sales

Reservations must integrate cleanly with the existing Sales workflow.

A reservation should not itself perform the physical stock deduction.

The intended lifecycle is:

Sale / Order
↓
Reservation
↓
Dispatch
↓
Physical stock reduction

When reserved stock is actually dispatched:

- The reserved quantity must be released/consumed appropriately.
- Physical stock must be reduced through the existing Dispatch/inventory movement mechanism.
- Do not deduct stock merely because a reservation exists.

If a reservation is cancelled or expires:

- Its reserved quantity becomes Available again.
- Physical On Hand remains unchanged.

Avoid double-counting reserved quantities.

---

## 1.5 Reservation list

Provide a user-friendly reservation view/history.

Display:

- Reservation Number
- Product
- Customer
- Warehouse / Location
- Reserved Quantity
- Available/remaining reserved quantity where applicable
- Reservation Date
- Expiry Date
- Status
- Reference (Quotation / Sales Order, if applicable)

Provide actions appropriate to the status:

- View
- Cancel
- Fulfill / consume where appropriate

Expired reservations should no longer reduce Available Stock.

If the existing architecture already has reservation-expiration handling, integrate with it. Otherwise implement a safe mechanism for marking expired reservations without changing historical records.

================================================== 2. LOW-STOCK WARNING LEVEL
==================================================

Add a configurable low-stock warning threshold for products.

The purpose is to warn the organization when the quantity available for sale/use falls to or below a configured threshold.

The warning should be based on:

Available Stock = On Hand Stock - Reserved Stock

NOT simply On Hand Stock.

Example:

On Hand = 50 Box
Reserved = 35 Box
Available = 15 Box
Low Stock Warning Level = 20 Box

Result:

LOW STOCK

Even though physical stock is still 50 Box, only 15 Box is currently available.

---

## 2.1 Product inventory settings

Add an Inventory Settings section for each product.

At minimum provide:

- Low Stock Warning Level
- Unit

Example:

Low Stock Warning Level:
[ 20 ] [ Box ]

The unit should come from the existing product/unit architecture.

Do not create a second independent unit system.

The user should not have to manually maintain an unrelated unit definition for this setting.

---

## 2.2 Product-specific threshold

The warning threshold must be configurable per product because different products have different stock requirements.

Examples:

Kajaria 600×600 Tile
Low Stock Warning Level: 30 Box

Cera Wash Basin
Low Stock Warning Level: 20 Pieces

Tile Adhesive
Low Stock Warning Level: 10 Bags

Granite Slab
Low Stock Warning Level: 3 Slabs

Do not use one global threshold for all products.

---

## 2.3 Optional future reorder support

Structure the implementation so that future replenishment functionality can be added without redesigning the feature.

However, do NOT implement automatic purchase/replenishment unless the existing architecture already supports it.

For this implementation, the Low Stock Warning Level is primarily a warning/visibility feature.

If the existing database already contains a suitable reorder-level concept, evaluate whether it can be reused. Do not create duplicate fields unnecessarily.

================================================== 3. INVENTORY PAGE INTEGRATION
==================================================

Integrate both features into the redesigned Inventory page.

The primary Inventory page should remain stock-oriented.

Summary cards:

- Total Stock
- Available Stock
- Reserved Stock
- Low Stock

Main stock table:

Product | Warehouse/Location | On Hand | Reserved | Available | Status

Examples:

Kajaria Royal Gold
600 × 600 mm
On Hand: 120 Box
Reserved: 30 Box
Available: 90 Box
Status: Normal

Cera Wash Basin
On Hand: 18 Pieces
Reserved: 3 Pieces
Available: 15 Pieces
Status: Low Stock

Tile Adhesive
On Hand: 40 Bags
Reserved: 10 Bags
Available: 30 Bags
Status: Normal

Do not add a generic separate "Unit" column if the unit can be naturally displayed with the quantity.

For example:

120 Box
30 Box
90 Box

rather than:

120 | Box
30 | Box
90 | Box

---

## 3.1 Low-stock visual state

Clearly identify products whose Available Stock is at or below the configured Low Stock Warning Level.

Use a business-friendly status:

- Normal
- Low Stock

If stock reaches zero, optionally distinguish:

- Out of Stock

Do not introduce excessive inventory statuses unless required by the existing architecture.

The status must be calculated from authoritative backend data.

Do not calculate authoritative low-stock status only in React.

---

## 3.2 Inventory actions

Inventory actions should include:

- Reserve Stock
- Transfer Stock
- Adjust Stock
- Stock Count

Do NOT add an "Add Stock" action for normal purchasing.

Normal stock entry remains:

Purchase Order / Purchase
↓
GRN
↓
Receive / Post GRN
↓
Inventory

Do not bypass GRN for ordinary stock receiving.

================================================== 4. STOCK DETAIL VIEW
==================================================

When the user opens a product's stock details, show:

Product
SKU
Category
Relevant Product Details

Stock summary:

On Hand
Reserved
Available
Status

Warehouse/location breakdown.

Reservation information.

Low Stock Warning Level.

Recent stock activity.

For granite/slab products, retain the existing slab-specific capability and allow the user to inspect individual slab information where applicable.

Example:

Granite Product

On Hand: 7 Slabs
Reserved: 2 Slabs
Available: 5 Slabs

Total Area:
52.75 sq.ft.

Then provide access to individual slab records/details.

Do not force ordinary tile, sanitaryware, or bagged products into an individual-slab/object-oriented presentation.

================================================== 5. DATABASE / DOMAIN DESIGN
==================================================

Inspect the existing schema first.

Do not blindly create new tables.

Reuse existing reservation infrastructure if it already satisfies the requirement.

If schema changes are required:

- Preserve organization_id tenant isolation.
- Add appropriate foreign keys.
- Add appropriate indexes.
- Preserve historical reservation records.
- Avoid destructive changes unless required.
- Follow existing naming conventions.
- Ensure organization-scoped uniqueness where appropriate.

For low-stock configuration, determine the most appropriate existing domain entity.

The threshold is a property of the organization's product/inventory configuration, so it must be organization-specific.

Do NOT make the threshold a global platform-level value.

Different organizations may configure different thresholds for the same real-world product.

Example:

Organization A:
Kajaria Tile → Low Stock Level = 20 Box

Organization B:
Kajaria Tile → Low Stock Level = 50 Box

These must remain independent.

================================================== 6. UNIT HANDLING
==================================================

Reuse the existing:

- purchase_unit
- sales_unit
- base_unit
- unit conversion

architecture.

Do not introduce a second unit-conversion framework.

Always display stock as:

Quantity + Unit

Examples:

120 Box
18 Pieces
40 Bags
7 Slabs

Where a secondary measurement is meaningful, it may also be displayed.

Examples:

40 Bags
1,000 kg

7 Slabs
52.75 sq.ft.

Do not replace the primary stock unit with the secondary measurement.

For example, do NOT display:

"1,000 kg"

instead of:

"40 Bags"

unless the product is actually stocked/sold in kilograms.

================================================== 7. API / BACKEND
==================================================

Create or update appropriate API endpoints for:

- Creating a reservation
- Listing reservations
- Viewing reservation details
- Cancelling a reservation
- Fulfilling/consuming a reservation where required
- Expiring reservations
- Returning current stock availability
- Updating product low-stock settings
- Returning low-stock status

Follow the existing API conventions.

Backend must be authoritative for:

- On Hand
- Reserved
- Available
- Low Stock status

Do not make React responsible for authoritative inventory calculations.

Where possible, return a stock representation such as:

{
product,
warehouse,
location,
on_hand,
reserved,
available,
unit,
low_stock_warning_level,
status
}

Use the actual project response/resource conventions rather than blindly copying this structure.

================================================== 8. INVENTORY MOVEMENTS / AUDIT
==================================================

Preserve the existing append-only inventory movement/audit mechanism.

Reservation actions must be auditable.

If the existing inventory movement system already supports reservation-related movement types, reuse them.

Do not create duplicate movement/audit systems.

Reservation creation, cancellation, fulfillment, and relevant stock changes must leave an appropriate audit trail according to the existing domain model.

Do not rewrite or mutate historical inventory movements.

================================================== 9. CONCURRENCY AND DATA INTEGRITY
==================================================

Pay particular attention to concurrent reservation attempts.

Example:

Available stock = 10 Box.

User A attempts to reserve 7 Box.
User B simultaneously attempts to reserve 6 Box.

The system MUST NOT allow both reservations to succeed.

The backend must use appropriate transaction/locking/atomic-update techniques consistent with PostgreSQL and the existing Laravel architecture.

The final state must never allow:

Reserved > On Hand

or:

Available < 0

unless an explicitly supported business rule in the existing architecture requires otherwise.

================================================== 10. RBAC / TENANCY
==================================================

Respect existing roles and permissions.

Only authorized organization users may:

- create reservations
- cancel reservations
- configure low-stock thresholds
- perform other reservation management actions

Platform/Super Admin users remain global users.

Do not assign tenant product/reservation records to a fake platform organization.

Every organization-specific reservation and low-stock configuration must remain tenant-scoped.

Never allow one organization to see or modify another organization's:

- stock
- reservations
- thresholds
- customers
- warehouse data

================================================== 11. REACT IMPLEMENTATION
==================================================

Use the existing React architecture and components.

Avoid introducing unnecessary state duplication.

If TanStack Query is already available or is part of the project's intended architecture, prefer it for:

- stock queries
- reservation queries
- mutations
- invalidation/refetching

After a successful reservation:

- refresh/invalidate the relevant stock query
- update Reserved
- update Available
- update status if the stock becomes low

After cancellation/expiry:

- refresh/invalidate relevant stock data
- decrease Reserved
- increase Available

Do not manually maintain multiple competing copies of stock state.

Warehouse and storage-location selections must be loaded dynamically from the backend.

Do not hard-code warehouse IDs such as 1 or 2.

================================================== 12. VALIDATION / UX
==================================================

Reservation form validation:

- Product required
- Warehouse required where applicable
- Quantity required
- Quantity > 0
- Unit must be valid for the selected product
- Quantity cannot exceed current Available Stock
- Expiry date cannot be invalid
- Customer/reference validation according to business rules

Low-stock setting validation:

- Must be numeric
- Must not be negative
- Must use an appropriate product unit
- Must respect the existing precision rules for quantities

Provide clear messages such as:

"Only 12 Box is currently available."

"Cannot reserve 20 Box because only 12 Box is available."

"Low Stock: 15 Box available. Warning level is 20 Box."

================================================== 13. REPORTING
==================================================

Ensure inventory reporting can distinguish:

- On Hand
- Reserved
- Available
- Low Stock

Stock History should continue to use the existing inventory movement data.

Reservation history should remain separately identifiable.

Do not distort the physical stock ledger by treating a reservation as a purchase, sale, or physical stock movement.

A reservation is a commitment of existing stock, not physical stock receipt or dispatch.

================================================== 14. IMPORTANT DOMAIN RULES
==================================================

Follow these rules throughout the implementation:

1. On Hand represents physical stock.

2. Reserved represents stock committed but not yet physically dispatched/consumed.

3. Available = On Hand - Reserved.

4. Reservation does not reduce On Hand.

5. Dispatch reduces physical stock.

6. Cancellation/expiry of a reservation does not increase On Hand; it only releases Reserved quantity back to Available.

7. Low Stock status is based on Available quantity.

8. Low Stock Warning Level is organization-specific and product-specific.

9. Reservation quantity must use the existing unit architecture.

10. Ordinary products should be represented as aggregated stock where appropriate.

11. Individually tracked slabs/serialized items must retain their existing individual tracking.

12. Do not expose internal InventoryObject mechanics as the primary user-facing inventory concept.

13. Do not create duplicate inventory, reservation, unit, or movement systems.

================================================== 15. IMPLEMENTATION PROCESS
==================================================

Before coding:

1. Inspect the existing inventory migrations.
2. Inspect InventoryObject and InventoryMovement.
3. Inspect ReservationService and all reservation-related models/migrations.
4. Inspect existing inventory API routes/controllers/resources.
5. Inspect InventoryManager.jsx and related inventory components.
6. Inspect ProductVariant and existing pricing/product configuration.
7. Inspect the existing unit/conversion implementation.
8. Inspect existing RBAC/organization-scoping mechanisms.
9. Determine exactly which existing components can be reused.
10. Identify only the minimum required database/API/UI changes.

Then implement the feature end-to-end.

After implementation:

- Run migrations.
- Run backend tests.
- Run frontend tests/build/lint where available.
- Add/update automated tests for reservation creation, concurrent availability validation, cancellation, expiry, fulfillment, available-stock calculation, low-stock thresholds, tenant isolation, and unit handling.
- Verify that existing GRN, inventory, dispatch, sales, stock adjustment, transfer, and stock count behavior is not broken.

The final implementation should make Inventory understandable to a normal Tiles & Sanitary ERP user:

They should think in terms of:

Product
→ On Hand
→ Reserved
→ Available
→ Low Stock
→ Reserve Stock

rather than:

InventoryObject
→ object_code
→ inventory_behavior
→ internal movement mechanics.

Preserve the sophisticated underlying inventory architecture where it is technically necessary, but keep the user-facing experience simple and business-oriented.
