Redesign and implement the Sales & Billing module for the Tiles & Sanitaryware ERP.

IMPORTANT:

- This is an existing Laravel + React + PostgreSQL ERP.
- First inspect the entire uploaded codebase before changing anything.
- Do not build a separate sales system.
- Reuse the existing Sales domain, Product domain, Inventory domain, Customer domain, Accounting domain, Workflow domain, and existing database architecture.
- The existing Sales domain contains Quotation, Sales Order, Dispatch, Customer Invoice, and Sales Return concepts.
- Preserve those concepts where they are useful.
- However, redesign the user-facing Sales workflow around the practical needs of a tiles/sanitaryware retail and wholesale shop.
- Do not expose unnecessary technical/domain complexity to normal shop staff.

==================================================

1. # BUSINESS OBJECTIVE

The Sales module should allow a shop employee to quickly:

1. Select a customer.
2. Add products.
3. Check current stock.
4. Enter quantity.
5. Select the appropriate selling unit.
6. Apply permitted discounts.
7. Calculate GST/tax.
8. Calculate the final invoice amount.
9. Select payment status/method where supported.
10. Confirm the sale.
11. Reserve/dispatch/reduce stock according to the existing business rules.
12. Generate a professional printable/downloadable invoice.

The primary goal is:

Customer
→ Select Products
→ Check Stock
→ Calculate Amount
→ Confirm Sale
→ Generate Invoice

================================================== 2. IMPORTANT SALES WORKFLOW DECISION
==================================================

Do not force every ordinary counter sale through:

Quotation
→ Sales Order
→ Dispatch
→ Invoice

That is unnecessarily lengthy for a normal retail sale.

Support a direct sale/invoice workflow for immediate sales.

Conceptually:

DIRECT SALE
Customer
↓
Sale / Invoice
↓
Stock availability check
↓
Dispatch / stock deduction
↓
Invoice
↓
Payment / customer balance
↓
Print / PDF

For larger or deferred orders, preserve:

Quotation
↓
Sales Order
↓
Reservation / Allocation
↓
Dispatch
↓
Invoice

The implementation must use the existing domain rules rather than bypassing them.

================================================== 3. INVENTORY RULE
==================================================

Inventory must never be reduced merely because a draft sale or quotation exists.

Inspect the existing Dispatch implementation and preserve its established rule:

Stock reduction occurs when the physical dispatch is executed.

Therefore:

Draft Sale
→ No stock reduction

Quotation
→ No stock reduction

Sales Order
→ No stock reduction unless the existing reservation mechanism explicitly reserves stock

Dispatch
→ Actual stock reduction

The audit of the existing project confirms that stock reduction is tied to Dispatch execution. Preserve this behavior.

Do not introduce a second stock-deduction mechanism inside the invoice UI.

================================================== 4. SALES PAGE DESIGN
==================================================

Create a clean Sales page suitable for a retail counter.

Recommended layout:

Sales

[ New Sale ] [ Sales History ]

Optional summary cards:

Today's Sales
Invoices
Pending Payments
Returns

Then a sales/invoice list:

Invoice No.
Date
Customer
Items
Total
Payment Status
Status
Actions

Example:

INV-2026-00125
05 Sep 2026
Walk-in Customer
5 Items
₹48,750
Paid
Completed

Actions:

View
Print
PDF
Return where permitted

================================================== 5. NEW SALE SCREEN
==================================================

The primary action should be:

[ + New Sale ]

Open a dedicated Sale / Invoice screen.

Layout:

NEW SALE

Customer
[ Search customer... ] [ + Add Customer ]

Invoice Date
[ Current Date ]

Optional:
Reference / Remarks

Then:

PRODUCTS

[ Search product, SKU, barcode... ]

Product
Quantity
Unit
Rate
Discount
Tax
Amount
Remove

Example:

Simpolo ORO BIANCO
600 × 1200 mm
Qty: 10
Unit: Box
Rate: ₹2,400
Discount: ₹100
GST: 18%
Amount: ₹23,000

Add another product.

================================================== 6. PRODUCT SELECTION
==================================================

Product search must use the organization's existing products.

Search by:

- Product name
- SKU
- Barcode
- GTIN where supported

Display useful product information:

Product name
Size
Category
Available stock
Selling price
Sales unit

Example:

Simpolo ORO BIANCO
600 × 1200 mm
Available: 42 Box
Selling Price: ₹2,400 / Box

Do not expose internal Product Variant terminology to ordinary users.

The database may continue to use product_variants internally.

================================================== 7. STOCK AVAILABILITY
==================================================

When a product is selected, show current available stock.

Example:

Available Stock: 42 Box

If user enters:

Quantity: 50 Box

show:

Insufficient stock.
Only 42 Box is available.

Do not allow the sale to proceed if the existing inventory rules prohibit the requested quantity.

Do not calculate authoritative stock only in React.

The backend must validate stock again when the sale/dispatch is committed.

This prevents race conditions where another user sells the same stock simultaneously.

================================================== 8. WAREHOUSE / STOCK LOCATION
==================================================

For organizations with multiple warehouses, the sale/dispatch must identify the warehouse from which the goods are supplied.

Example:

Warehouse
[ Main Warehouse ▼ ]

Then show availability for that warehouse.

Do not hard-code warehouse IDs or names.

Load actual organization warehouses dynamically.

If the existing Sales/Dispatch model already stores warehouse_id, reuse it.

================================================== 9. TILES AND UNIT HANDLING
==================================================

Tiles may be sold using different units depending on the product configuration.

Examples:

Piece
Box
Sq.ft.
Sq.m

The product already has:

Purchase Unit
Sales Unit
Base Unit

Use the existing product/unit architecture.

Do not create another unit conversion system.

If the product's selling unit is Box:

Qty:
[ 10 ]

Unit:
Box

Show packaging information where useful:

1 Box = 4 Pieces

If the existing pricing architecture supports pricing in a different basis, respect it.

For example:

Selling Price:
₹65 / Sq.ft.

Quantity:
350 Sq.ft.

The invoice must calculate the amount correctly.

Do not hard-code all sales to pieces or boxes.

================================================== 10. TILE SALES EXAMPLE
==================================================

Support a normal transaction such as:

Customer:
ABC Constructions

Product:
Kajaria Royal Gold
600 × 600 mm

Quantity:
25 Box

Selling Price:
₹1,250 / Box

Discount:
₹50 / Box

GST:
18%

Calculate:

Gross Amount
Discount
Taxable Amount
GST
Grand Total

Display the calculation clearly.

================================================== 11. SANITARYWARE SALES EXAMPLE
==================================================

Example:

Customer:
John Singh

Product:
Cera Wall Hung WC

Quantity:
2 Pieces

Selling Price:
₹12,500 / Piece

GST:
18%

Invoice should show:

2 × ₹12,500
= ₹25,000

plus applicable tax.

================================================== 12. GRANITE / MARBLE SALES
==================================================

Granite and marble may be individually tracked as slabs.

Preserve the existing slab/inventory architecture.

For slab sales, the system may need to identify the actual slab(s) being dispatched.

Example:

Black Galaxy Granite

Available:
7 Slabs
52.75 sq.ft.

When selling a specific slab:

Slab Code
Size
Area
Price Basis
Amount

Example:

SLAB-001
8 × 4 ft
32.00 sq.ft.
₹250 / sq.ft.
₹8,000

Do not force normal tile sales to use individual inventory objects.

Only invoke slab-specific selection where the product requires it.

================================================== 13. DISCOUNT
==================================================

Support discount at line level and/or invoice level according to the existing business rules.

Possible:

Discount %
or
Discount Amount

Example:

Quantity: 10
Rate: ₹2,500
Gross: ₹25,000
Discount: ₹1,000
Taxable: ₹24,000

Do not allow discounts beyond the user's permission/authorization if such permissions exist.

Do not hard-code discount limits.

If no existing permission/limit mechanism exists, implement the UI so that business rules can be added without rewriting the calculation engine.

================================================== 14. GST / TAX
==================================================

Use the existing tax profile architecture.

Do not manually hard-code GST percentages into React.

The product/tax configuration should determine the applicable tax.

The invoice should clearly show:

Taxable Amount
CGST
SGST
IGST

where applicable.

The exact tax presentation should follow the existing organization's tax configuration.

For an intra-state transaction:

CGST
SGST

For an inter-state transaction where applicable:

IGST

Do not assume CGST + SGST for every invoice.

================================================== 15. CUSTOMER
==================================================

Allow:

[ Search Customer ]

and:

[ + Add Customer ]

Support the existing customer model.

Customer information should include, where applicable:

Customer Name
Phone
Email
Billing Address
Shipping Address
GSTIN
State

Do not require GSTIN for every customer if the existing business rules allow retail/walk-in customers without GST registration.

Support a "Walk-in Customer" or equivalent existing customer workflow if the domain supports it.

Do not create duplicate customers unnecessarily.

================================================== 16. BILLING ADDRESS / SHIPPING ADDRESS
==================================================

The invoice should support:

Bill To
Ship To

For a simple counter sale, these may be the same.

Allow:

[ Same as billing address ]

For delivery sales, allow a different shipping address.

Use the existing customer/address architecture if available.

================================================== 17. PAYMENT
==================================================

Inspect the existing accounting/payment implementation before changing the schema.

The invoice currently has statuses such as:

UNPAID
PARTIALLY_PAID
PAID
CANCELLED

Preserve these concepts.

The Sale screen should allow payment handling appropriate to the existing accounting architecture.

Example:

Payment Status:
[ Paid ]

Payment Method:
[ Cash ▼ ]

or:

[ UPI ]
[ Bank Transfer ]
[ Card ]
[ Credit ]

If partial payment is supported:

Invoice Total:
₹50,000

Paid:
₹30,000

Balance:
₹20,000

Do not invent a separate customer ledger system if one already exists.

The invoice/payment transaction must integrate with the existing accounting domain.

================================================== 18. SALE CONFIRMATION
==================================================

Before final submission show:

Customer
Items
Subtotal
Discount
Tax
Grand Total
Paid
Balance

Then:

[ Save Draft ]

[ Confirm Sale ]

Confirmation should clearly indicate that confirming the sale may result in stock dispatch/deduction according to the existing workflow.

Do not make an irreversible action look like a normal Save button.

================================================== 19. TRANSACTION ATOMICITY
==================================================

Sale confirmation must be transactional.

The backend should ensure that:

- Invoice creation
- Invoice items
- Dispatch where required
- Inventory reduction
- Accounting entries
- Payment records where applicable

are handled consistently according to the existing domain architecture.

If any critical step fails, the transaction must not leave partially completed stock/invoice state.

Do not implement these operations as unrelated frontend API calls.

Prefer a backend application service/use-case that coordinates the transaction.

================================================== 20. CONCURRENCY / STOCK RACE CONDITIONS
==================================================

Two users may attempt to sell the same product simultaneously.

Therefore:

Frontend stock display is informational.

Backend must re-check availability during final sale/dispatch execution.

Example:

User A sees:
Available = 10 Box

User B sees:
Available = 10 Box

User A sells:
8 Box

User B attempts:
7 Box

The backend must reject or appropriately handle User B's transaction.

Do not rely on the frontend quantity check.

================================================== 21. INVOICE NUMBER
==================================================

Invoice numbers must be generated by the backend.

Use the existing organization-specific unique invoice number architecture.

The current schema has:

organization_id
invoice_number

with a unique constraint on:

organization_id + invoice_number

Preserve this.

Do not allow users to freely overwrite invoice numbers unless the existing business rules explicitly require it.

Example:

INV-2026-000001
INV-2026-000002

Use the organization's existing numbering configuration if one exists.

================================================== 22. INVOICE DATE
==================================================

Use the current date by default.

Allow modification only if permitted by the existing accounting/business rules.

The backend remains authoritative.

================================================== 23. INVOICE DESIGN
==================================================

Generate a professional GST-compatible business invoice.

The invoice should be suitable for:

- Printing
- PDF generation
- Customer sharing
- Record keeping

Suggested layout:

==================================================
TAX INVOICE
==================================================

[COMPANY LOGO]

COMPANY NAME
Business Address
Phone | Email
GSTIN: XXXXXXXXXXXXXXX

Invoice No: INV-2026-000125
Invoice Date: 05 Sep 2026

Bill To:
ABC Constructions
Address...
GSTIN: ...
State: ...

Ship To:
...

---

# Product Qty Unit Rate Tax Amount

---

1 Kajaria Royal Gold 25 Box ₹1,250 18% ₹31,250
600 × 600 mm

## 2 Cera Wash Basin 2 Pcs ₹4,500 18% ₹9,000

                         Subtotal:        ₹40,250
                         Discount:        ₹1,000
                         Taxable Amount:  ₹39,250

                         CGST:             ₹3,532.50
                         SGST:             ₹3,532.50

                         GRAND TOTAL:     ₹46,315.00

Amount in Words:
Rupees Forty-Six Thousand Three Hundred Fifteen Only

Payment:
Paid: ₹46,315
Balance: ₹0

---

Terms & Conditions
...

Authorized Signatory

==================================================

24. # INVOICE TABLE COLUMNS

Use appropriate columns depending on the product and pricing basis.

Minimum:

#

Product
Description/Size
Qty
Unit
Rate
Discount
Tax
Amount

For tile products, the description may show:

600 × 600 mm

For sanitaryware:

White
Wall Hung WC

For granite:

Slab Code
8 × 4 ft
32 sq.ft.

Do not make the invoice excessively wide.

The PDF must remain readable on A4 paper.

================================================== 25. GST PRESENTATION
==================================================

For CGST + SGST:

Taxable Value
CGST @ X%
SGST @ X%

For IGST:

Taxable Value
IGST @ X%

Show tax totals clearly.

Where appropriate, include a tax summary:

Tax Rate | Taxable Amount | CGST | SGST | IGST | Total Tax

This is useful for accounting and GST reporting.

================================================== 26. ROUNDING
==================================================

Use backend decimal calculations.

Do not rely on JavaScript floating-point arithmetic for authoritative financial totals.

Invoice calculations should use appropriate decimal precision.

Define a consistent rounding policy.

The displayed final invoice amount must match the stored accounting amount.

================================================== 27. AMOUNT IN WORDS
==================================================

Generate the grand total in words.

Example:

₹46,315.00

Rupees Forty-Six Thousand Three Hundred Fifteen Only

Use an appropriate Indian currency/number-to-words implementation.

Do not implement this as an unreliable frontend-only string conversion.

================================================== 28. PDF GENERATION
==================================================

Invoice PDF generation should be server-side.

Do not generate the authoritative invoice PDF solely with browser HTML/canvas.

The PDF should:

- Use A4 layout.
- Include company information.
- Include invoice number/date.
- Include customer information.
- Include line items.
- Include tax breakup.
- Include totals.
- Include payment status.
- Include amount in words.
- Include terms where configured.
- Include authorized signatory area where applicable.

The same invoice data must be used for:

View Invoice
Print Invoice
Generate PDF

Do not maintain separate calculation implementations.

================================================== 29. INVOICE PREVIEW
==================================================

After confirming the sale, show:

Sale Completed

Invoice:
INV-2026-000125

Customer:
ABC Constructions

Total:
₹46,315

Payment:
Paid

Buttons:

[ View Invoice ]
[ Print ]
[ Download PDF ]
[ New Sale ]

The invoice preview should use the same layout/data as the generated PDF as closely as practical.

================================================== 30. INVOICE DETAIL PAGE
==================================================

Create a clean invoice detail view.

Header:

TAX INVOICE

Invoice No.
Date
Status

Customer information

Items

Totals

Payment information

Stock/dispatch information where useful

Actions:

[ Print ]
[ PDF ]
[ Return ]
[ Cancel ] where permitted

Do not allow ordinary users to silently edit finalized invoice financial values.

Corrections should follow proper cancellation/return/credit-note business rules if supported.

================================================== 31. SALES HISTORY
==================================================

Create a Sales History list.

Columns:

Invoice No.
Date
Customer
Total
Payment Status
Invoice Status
Actions

Filters:

Date range
Customer
Payment status
Invoice status
Search invoice number

Use backend pagination and filtering.

Do not load every invoice into React.

================================================== 32. SALES RETURNS
==================================================

Preserve the existing Sales Return domain.

A return should reference the original invoice.

Example:

Return:
RET-000012

Original Invoice:
INV-2026-000125

Returned Product:
Kajaria Royal Gold
Quantity:
2 Box

The return must:

- Validate that the original sale exists.
- Validate returnable quantity.
- Update inventory according to the existing return rules.
- Update accounting/customer balance where applicable.
- Maintain an immutable audit trail.

Do not implement returns as simply editing invoice quantities.

================================================== 33. QUOTATIONS AND SALES ORDERS
==================================================

Do not remove the existing Quotation or Sales Order functionality.

Instead, provide separate workflows where useful:

Sales
├── New Sale
├── Invoices
├── Sales Orders
├── Quotations
└── Returns

The ordinary shop employee should not be forced to understand all these documents when making an immediate sale.

================================================== 34. DISPATCH
==================================================

Preserve Dispatch as the physical stock-out operation.

For immediate counter sales:

Sale confirmation should coordinate with the existing dispatch execution mechanism where the business workflow requires physical stock deduction.

For delivery orders:

Sales Order
→ Dispatch
→ Invoice

where appropriate.

Do not duplicate inventory deduction logic inside Invoice.

================================================== 35. ACCOUNTING INTEGRATION
==================================================

Inspect the existing Accounting domain before implementation.

A confirmed invoice should integrate with the existing accounting architecture.

Potential accounting effects include:

Customer Receivable / Cash / Bank
→ Sales Revenue
→ Tax Liability

The exact accounts and journal creation must follow the existing Chart of Accounts and accounting services.

Do not implement accounting journal entries directly inside React.

Do not create a parallel sales-ledger mechanism.

================================================== 36. CUSTOMER BALANCE
==================================================

If the existing customer ledger/accounting system supports receivables, show:

Invoice Total
Paid
Outstanding

Example:

Invoice Total: ₹100,000
Paid: ₹40,000
Outstanding: ₹60,000

Customer's outstanding balance should be derived from the accounting/customer ledger system.

Do not maintain a duplicate manually calculated balance in the frontend.

================================================== 37. TAX INVOICE VS RECEIPT
==================================================

Clearly distinguish:

Tax Invoice
Payment Receipt

The Tax Invoice describes the sale and tax.

A payment receipt confirms payment.

Do not mix these documents unless the existing business rules intentionally define a combined document.

If payment is received immediately, the invoice may display payment information, but it remains a Tax Invoice.

================================================== 38. WALK-IN CUSTOMER
==================================================

Support quick retail billing for customers who do not need a full customer account.

If the existing Customer domain supports a generic walk-in customer, reuse it.

The user should be able to create a quick invoice without filling unnecessary customer information.

However, GST-required information should be collected when applicable.

================================================== 39. PERMISSIONS
==================================================

Respect existing RBAC and permissions.

Possible permissions:

sales.view
sales.create
sales.edit
sales.confirm
sales.cancel
sales.return
sales.invoice.print
sales.invoice.download
sales.discount
sales.payment

Use the project's existing permission conventions.

Do not invent a separate authorization system.

================================================== 40. TENANT ISOLATION
==================================================

All Sales data must remain organization-scoped.

Never allow a user to access another organization's:

- Customers
- Products
- Sales Orders
- Invoices
- Dispatches
- Sales Returns
- Payments
- Sales history

The backend must enforce tenant isolation.

Do not rely on organization IDs supplied by the React client.

================================================== 41. FRONTEND ARCHITECTURE
==================================================

Inspect the existing React architecture.

Use the project's established patterns.

If TanStack Query is already available or being introduced as part of the project's architecture, prefer it for:

- Products
- Customers
- Warehouses
- Sales
- Invoices
- Sales history

Do not create unnecessary prop-drilling or duplicated API state.

Do not put business calculations and accounting rules into React.

================================================== 42. API ARCHITECTURE
==================================================

Inspect existing API routes and controllers.

If Sales APIs are incomplete, create clean endpoints such as:

GET /api/sales
POST /api/sales
GET /api/sales/{id}
POST /api/sales/{id}/confirm
POST /api/sales/{id}/cancel
GET /api/invoices
GET /api/invoices/{id}
GET /api/invoices/{id}/pdf
POST /api/sales/{id}/return

Use the project's existing route conventions rather than blindly copying these exact paths.

The important requirement is a clean separation between:

- Draft creation
- Confirmation
- Dispatch/stock deduction
- Invoice generation
- Payment
- Cancellation
- Return

================================================== 43. BACKEND USE-CASE DESIGN
==================================================

Prefer application/domain services such as:

CreateSale
ConfirmSale
DispatchSale
GenerateInvoice
RecordPayment
CancelSale
CreateSalesReturn

or equivalent services already present in the codebase.

Do not place the complete sales workflow inside a controller.

Do not place business rules inside React.

================================================== 44. INVOICE IMMUTABILITY
==================================================

Once a finalized invoice has been issued:

Do not silently modify:

- Product
- Quantity
- Unit price
- Tax
- Total
- Customer

If a correction is required, use appropriate:

Cancellation
Return
Credit adjustment
Reissue

according to the existing accounting architecture.

Historical invoices must remain reproducible.

================================================== 45. DOCUMENT SNAPSHOT
==================================================

When an invoice is finalized, ensure that historical invoice information remains stable even if the product's current:

- Name
- SKU
- Selling price
- Tax configuration
- Packaging
- Product details

changes later.

Inspect the existing invoice schema and determine what historical snapshot data is currently missing.

Do not allow a future product edit to change the meaning of an old invoice.

If schema changes are required, introduce them carefully.

================================================== 46. PRODUCT PRICING
==================================================

Use the existing Organization Product Pricing & Packaging architecture.

When adding a product to a sale:

Retrieve the applicable current selling price according to the existing pricing rules.

Do not hard-code product prices.

However, when the sale/invoice is finalized, store the actual unit price used on the invoice item.

Historical invoices must not change when the product's current selling price changes.

================================================== 47. PACKAGING
==================================================

For tiles, packaging can change over time.

Do not use the current Product Packaging record to reinterpret historical invoices.

Example:

2026:
1 Box = 4 Pieces

2028:
1 Box = 2 Pieces

An invoice issued in 2026 must retain the quantity/pricing basis that actually applied at the time.

Use the existing pricing/packaging architecture and snapshot relevant transaction data when necessary.

================================================== 48. SALES REPORTING
==================================================

Preserve the existing Sales Reporting functionality.

Sales reports should work from finalized transactions.

Do not count:

Draft invoices
Cancelled invoices

as completed sales.

Existing reports include concepts such as:

Sales Invoice Register
Sales Summary by Category

Preserve these and ensure the redesigned invoice workflow feeds them correctly.

================================================== 49. SEARCH AND PERFORMANCE
==================================================

Sales history and invoice lists must use backend filtering/pagination.

Product/customer search should not load thousands of records unnecessarily.

Inspect the existing API for N+1 relationships and eager-load required relations.

The architectural audit specifically identifies N+1 risks in API serialization and recommends explicit eager loading. Apply the same principle to Sales APIs.

================================================== 50. DATABASE CHANGES
==================================================

Do not blindly modify migrations.

First inspect:

- invoices
- invoice_items
- sales_orders
- sales_order_items
- dispatches
- dispatch_items
- customers
- payments/accounting
- tax profiles
- product pricing
- inventory movements

Determine what is already supported.

Only add migrations for genuine missing requirements.

Do not create duplicate invoice or sales tables.

================================================== 51. FINAL SALES NAVIGATION
==================================================

Recommended user-facing navigation:

SALES

├── New Sale
├── Invoices
├── Sales Orders
├── Quotations
└── Returns

The default Sales page should emphasize:

[ + New Sale ]

and recent invoices/sales.

================================================== 52. FINAL NEW SALE EXPERIENCE
==================================================

The ideal workflow should feel like:

NEW SALE

Customer
[ Search customer... ] [ + Add Customer ]

Warehouse
[ Main Warehouse ▼ ]

Invoice Date
[ 05/09/2026 ]

---

Add Product
[ Search product, SKU, barcode... ]

Product Qty Unit Rate Amount

Kajaria Royal Gold 10 Box ₹1,250 ₹12,500
600 × 600 mm

Simpolo ORO BIANCO 5 Box ₹2,400 ₹12,000
600 × 1200 mm

Cera Wash Basin 2 Pcs ₹4,500 ₹9,000

---

Subtotal: ₹33,500
Discount: ₹1,000
Taxable Amount: ₹32,500

CGST: ₹2,925
SGST: ₹2,925

Grand Total: ₹38,350

Payment:
[ Paid ▼ ]

Payment Method:
[ Cash ▼ ]

Paid: ₹38,350
Balance: ₹0

[ Save Draft ] [ Confirm Sale ]

================================================== 53. AFTER CONFIRMATION
==================================================

Show:

SALE COMPLETED

Invoice:
INV-2026-000125

Customer:
ABC Constructions

Total:
₹38,350

Payment:
Paid

Stock:
Dispatched

[ View Invoice ]
[ Print ]
[ Download PDF ]
[ New Sale ]

================================================== 54. IMPLEMENTATION PROCESS
==================================================

Before writing code:

1. Inspect all Sales models.
2. Inspect Sales enums.
3. Inspect Sales migrations.
4. Inspect existing routes.
5. Inspect controllers.
6. Inspect services/actions.
7. Inspect Dispatch implementation.
8. Inspect Inventory integration.
9. Inspect reservation/allocation integration.
10. Inspect Customer implementation.
11. Inspect Product Pricing & Packaging.
12. Inspect Tax Profile implementation.
13. Inspect Accounting/journal integration.
14. Inspect Sales Reporting.
15. Inspect existing frontend architecture.
16. Determine which parts are already implemented and reusable.
17. Identify missing functionality.
18. Only then implement the redesign.

Do not assume the architecture from the migration names alone.

================================================== 55. CRITICAL BUSINESS RULES
==================================================

The implementation must preserve these principles:

1. Draft sales do not reduce inventory.

2. Quotations do not reduce inventory.

3. Sales Orders do not directly reduce physical stock.

4. Reservations may block available stock according to the existing reservation mechanism.

5. Physical inventory reduction occurs during Dispatch execution.

6. Backend rechecks stock during final execution.

7. Invoice financial values are authoritative and historically stable.

8. Product price changes must not alter old invoices.

9. Product packaging changes must not alter old invoices.

10. Tax changes must not alter old invoices.

11. Confirmed financial transactions must be auditable.

12. Cancelled invoices must not be counted as completed sales.

13. Returns must reference the original sale/invoice.

14. Accounting entries must remain balanced.

15. All sales data must remain organization-scoped.

================================================== 56. FINAL DESIGN PRINCIPLE
==================================================

The Sales module should feel like a professional Tiles & Sanitaryware shop billing system, not an accounting database exposed through a web form.

The user should be able to understand the entire normal sale immediately:

Customer
→ Products
→ Quantity
→ Price
→ Discount
→ GST
→ Total
→ Payment
→ Confirm
→ Invoice

At the same time, the underlying ERP must preserve:

Sales Orders
Quotations
Reservations
Dispatch
Inventory Movements
Customer Receivables
Accounting Journals
Sales Returns
GST reporting
Auditability

Do not sacrifice domain correctness for UI simplicity.

The frontend should be simple.

The backend should remain rigorous.
