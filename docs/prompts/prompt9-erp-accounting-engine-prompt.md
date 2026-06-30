You are acting as:

- Principal ERP Architect
- Chartered Accountant
- Enterprise Accounting System Architect
- Double Entry Accounting Expert
- Senior Laravel 12 Architect
- Domain Driven Design Expert

Your task is to design and generate
a production-grade Accounting Engine
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
- Future business domains

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
ACCOUNTING PHILOSOPHY
=========================================================

This ERP must implement:

DOUBLE ENTRY ACCOUNTING.

Every transaction:

Debit Total

must equal

Credit Total.

No exceptions.

Never update account balances directly.

Everything must pass through:

Journal
↓
Journal Entries
↓
Ledger
↓
Financial Statements

=========================================================
ACCOUNTING EQUATION
=========================================================

Assets

=

Liabilities

- Capital

Examples:

Cash
Inventory
Bank
Receivables

=

Payables
Loans
Owner Capital

=========================================================
ACCOUNTING MODULES
=========================================================

Generate:

Account Groups

Accounts

Journals

Journal Entries

Ledger

Payments

Receipts

Bank Transactions

Financial Years

Opening Balances

Closing Entries

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

app/

    Domains/

        Accounting/

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

Generate migrations for:

financial_years

account_groups

accounts

journal_batches

journals

journal_entries

payments

receipts

bank_accounts

bank_transactions

opening_balances

closing_entries

=========================================================
FINANCIAL YEARS
=========================================================

Fields:

id

organization_id

name

start_date

end_date

is_active

is_closed

=========================================================
ACCOUNT GROUPS
=========================================================

Examples:

ASSETS

LIABILITIES

EQUITY

INCOME

EXPENSE

Current Assets

Fixed Assets

Current Liabilities

Direct Income

Direct Expense

Indirect Income

Indirect Expense

=========================================================
ACCOUNT GROUP HIERARCHY
=========================================================

Support:

parent_id

Examples:

ASSETS
↓
CURRENT ASSETS
↓
INVENTORY

LIABILITIES
↓
CURRENT LIABILITIES
↓
SUPPLIER PAYABLE

=========================================================
ACCOUNTS
=========================================================

Examples:

Cash Account

Bank Account

Inventory Account

Supplier Account

Customer Account

Sales Account

Purchase Account

Input GST

Output GST

Freight Charges

Salary Expense

=========================================================
ACCOUNT FIELDS
=========================================================

Fields:

id

organization_id

account_group_id

code

name

description

opening_balance

opening_type

is_system

is_active

=========================================================
SYSTEM ACCOUNTS
=========================================================

Generate support for:

Inventory

Sales

Purchase

Cash

Bank

Receivables

Payables

Input GST

Output GST

Rounding Off

Discount

=========================================================
JOURNAL BATCHES
=========================================================

Purpose:

Group related journals.

Examples:

Purchase Invoice

Sales Invoice

Inventory Adjustment

Payment

Receipt

=========================================================
JOURNALS
=========================================================

Fields:

id

organization_id

financial_year_id

journal_batch_id

voucher_no

voucher_type

voucher_date

description

reference_type

reference_id

status

=========================================================
JOURNAL ENTRIES
=========================================================

Fields:

id

journal_id

account_id

debit

credit

remarks

cost_center_id

branch_id

=========================================================
DOUBLE ENTRY VALIDATION
=========================================================

Validation:

SUM(debit)

must equal

SUM(credit)

before posting.

=========================================================
LEDGER
=========================================================

Generate:

General Ledger

Subsidiary Ledger

Customer Ledger

Supplier Ledger

Bank Ledger

Inventory Ledger

=========================================================
PAYMENTS
=========================================================

Generate:

Cash Payment

Bank Payment

Supplier Payment

Expense Payment

Fields:

payment_no

payment_date

amount

payment_mode

reference

=========================================================
RECEIPTS
=========================================================

Generate:

Cash Receipt

Bank Receipt

Customer Receipt

Other Receipt

=========================================================
BANKING
=========================================================

Generate:

bank_accounts

bank_transactions

Support:

Cheque

NEFT

RTGS

UPI

Card

Cash

=========================================================
OPENING BALANCES
=========================================================

Generate:

Opening Trial Balance

Opening Customer Balance

Opening Supplier Balance

Opening Inventory Value

Opening Bank Balance

=========================================================
CLOSING PROCESS
=========================================================

Generate:

Year Closing

Profit Transfer

Balance Carry Forward

Opening Balance Generation

=========================================================
ERP ACCOUNTING EVENTS
=========================================================

Generate:

JournalCreated

JournalPosted

JournalReversed

PaymentCreated

PaymentPosted

ReceiptCreated

ReceiptPosted

FinancialYearClosed

=========================================================
PURCHASE ACCOUNTING
=========================================================

Example:

Purchase Invoice

Inventory A/c Dr
Input GST A/c Dr

        To Supplier A/c

=========================================================
SALES ACCOUNTING
=========================================================

Example:

Customer A/c Dr

        To Sales A/c
        To Output GST

=========================================================
PAYMENT ACCOUNTING
=========================================================

Example:

Supplier A/c Dr

        To Bank A/c

=========================================================
RECEIPT ACCOUNTING
=========================================================

Example:

Bank A/c Dr

        To Customer A/c

=========================================================
INVENTORY ACCOUNTING
=========================================================

Examples:

Inventory Adjustment

Inventory Damage

Inventory Transfer

Inventory Writeoff

=========================================================
GST ACCOUNTING
=========================================================

Support:

CGST

SGST

IGST

GST Input Credit

GST Payable

HSN Reporting

=========================================================
COST CENTERS
=========================================================

Support:

Branch Cost Center

Department Cost Center

Project Cost Center

Warehouse Cost Center

=========================================================
FINANCIAL REPORTS
=========================================================

Generate:

Trial Balance

Profit and Loss

Balance Sheet

Cash Flow Statement

Fund Flow Statement

GST Report

Customer Outstanding

Supplier Outstanding

Bank Book

Cash Book

Day Book

=========================================================
ACCOUNTING SERVICES
=========================================================

Generate:

AccountService

JournalService

PostingService

LedgerService

PaymentService

ReceiptService

ClosingService

=========================================================
POSTING SERVICE
=========================================================

Generate:

postPurchase()

postSales()

postPayment()

postReceipt()

postInventoryAdjustment()

postInventoryDamage()

postPurchaseReturn()

postSalesReturn()

=========================================================
ACCOUNTING POLICIES
=========================================================

Generate:

AccountPolicy

JournalPolicy

PaymentPolicy

ReceiptPolicy

FinancialYearPolicy

=========================================================
ACCOUNTING EVENTS
=========================================================

Generate:

JournalPosted

PaymentPosted

ReceiptPosted

YearClosed

TrialBalanceGenerated

=========================================================
ACCOUNTING API
=========================================================

Generate APIs:

/accounts

/account-groups

/journals

/payments

/receipts

/ledgers

/trial-balance

/profit-loss

/balance-sheet

=========================================================
ACCOUNTING UI
=========================================================

Generate React modules:

ChartOfAccounts

JournalEntry

JournalList

GeneralLedger

TrialBalance

ProfitLoss

BalanceSheet

PaymentVoucher

ReceiptVoucher

BankBook

CashBook

GSTReports

=========================================================
AUDIT TRAIL
=========================================================

Every accounting operation must store:

who

when

what

old value

new value

ip address

device

=========================================================
SECURITY
=========================================================

Support:

Role permissions

Financial year locking

Voucher locking

Back-dated entry control

Approval workflow

=========================================================
OUTPUT FORMAT
=========================================================

For every component generate:

1. Business Purpose
2. Database Schema
3. Laravel Models
4. Services
5. Events
6. Policies
7. APIs
8. React Modules
9. Reports
10. Security
11. Audit
12. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate an enterprise-grade
double-entry accounting engine
supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite inventory
- Purchase accounting
- Sales accounting
- GST accounting
- Financial years
- Cost centers
- Audit trails
- Millions of transactions

Never optimize for CRUD.

Always optimize for:

- Accounting correctness
- Legal compliance
- Auditability
- ERP architecture
- Maintainability
- Scalability
