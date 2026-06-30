You are acting as:

- Principal Frontend Architect
- Senior React Architect
- Enterprise UI/UX Architect
- ERP Solution Architect
- React Performance Specialist

Your task is to design and generate
production-grade React modules for a
commercial Building Materials ERP.

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

Frontend:

- React 19+
- React Router
- Axios
- TanStack Query
- Bootstrap 5
- React Hook Form
- Zod Validation

Backend:

- Laravel 12 API
- Sanctum Authentication

Architecture:

- Feature Based Modules
- Domain Driven Design
- Component Driven Design

=========================================================
FRONTEND PHILOSOPHY
=========================================================

React is responsible for:

- User Interface
- User Experience
- Form Handling
- Client Validation
- State Management
- API Communication

React is NOT responsible for:

- Business Logic
- Inventory Calculations
- Accounting Rules
- Permission Decisions
- Tax Calculation

These remain in Laravel.

=========================================================
DIRECTORY STRUCTURE
=========================================================

Generate:

src/

    app/

        modules/

            master/

            security/

            product/

            inventory/

            purchase/

            sales/

            accounting/

            reporting/

            subscription/

        components/

        hooks/

        services/

        stores/

        layouts/

        routes/

        utils/

        constants/

        types/

=========================================================
MODULE STRUCTURE
=========================================================

Each module must contain:

module/

    pages/

    components/

    forms/

    hooks/

    services/

    validations/

    store/

    routes/

    types/

    constants/

=========================================================
GENERAL RULES
=========================================================

1. Use Functional Components.

2. Use React Hooks.

3. Use TanStack Query.

4. Use React Hook Form.

5. Use Zod validation.

6. Use Bootstrap 5.

7. Use feature-based organization.

8. Avoid prop drilling.

9. Keep components small.

10. Never place business logic in components.

=========================================================
LAYOUT STRUCTURE
=========================================================

Generate:

layouts/

    AppLayout.jsx

    AuthLayout.jsx

    DashboardLayout.jsx

    ReportLayout.jsx

=========================================================
ROUTING STRUCTURE
=========================================================

Generate:

routes/

    masterRoutes.js

    productRoutes.js

    inventoryRoutes.js

    purchaseRoutes.js

    salesRoutes.js

    accountingRoutes.js

Example:

/products

/products/create

/products/:id/edit

/products/:id/view

=========================================================
AUTHENTICATION MODULE
=========================================================

Generate:

login/

profile/

change-password/

forgot-password/

permissions/

Features:

- Sanctum
- Authentication Context
- Permission Guards
- Route Guards

=========================================================
MASTER MODULE
=========================================================

Generate modules:

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
MASTER MODULE STRUCTURE
=========================================================

Example:

modules/master/categories/

    pages/

        CategoryList.jsx

        CategoryCreate.jsx

        CategoryEdit.jsx

        CategoryView.jsx

    components/

        CategoryForm.jsx

        CategoryTree.jsx

        CategoryTable.jsx

        CategoryFilters.jsx

    hooks/

        useCategories.js

    services/

        categoryApi.js

    validations/

        categoryValidation.js

=========================================================
PRODUCT MODULE
=========================================================

Generate modules:

product_families

product_variants

product_attributes

unit_conversions

=========================================================
PRODUCT FAMILY UI
=========================================================

Generate:

ProductFamilyList

ProductFamilyCreate

ProductFamilyEdit

ProductFamilyView

Components:

ProductFamilyForm

ProductVariantTable

ProductImages

=========================================================
PRODUCT VARIANT UI
=========================================================

Generate:

ProductVariantList

ProductVariantCreate

ProductVariantEdit

ProductVariantView

Components:

PricingTab

AttributesTab

InventoryTab

BarcodeTab

UnitConversionTab

=========================================================
INVENTORY MODULE
=========================================================

Generate:

inventory_objects

inventory_movements

inventory_reservations

inventory_allocations

inventory_snapshots

=========================================================
INVENTORY UI
=========================================================

Generate:

InventoryDashboard

InventoryList

InventoryTransfer

InventoryAdjustment

InventoryReservation

InventoryAllocation

InventoryHistory

=========================================================
GRANITE MODULE
=========================================================

Generate:

GraniteSlabList

GraniteSlabCreate

GraniteSlabTransfer

GraniteSlabAllocate

GraniteSlabCut

GraniteRemnants

GraniteHistory

=========================================================
PURCHASE MODULE
=========================================================

Generate:

PurchaseOrderList

PurchaseOrderCreate

PurchaseOrderEdit

GRNList

GRNCreate

SupplierInvoiceList

PurchaseReturnList

=========================================================
PURCHASE WORKFLOW UI
=========================================================

Purchase Order

        ↓

Approve

        ↓

GRN

        ↓

Supplier Invoice

        ↓

Payment

=========================================================
SALES MODULE
=========================================================

Generate:

QuotationList

SalesOrderList

DispatchList

InvoiceList

SalesReturnList

=========================================================
SALES WORKFLOW UI
=========================================================

Sales Order

        ↓

Reservation

        ↓

Allocation

        ↓

Picking

        ↓

Dispatch

        ↓

Invoice

=========================================================
ACCOUNTING MODULE
=========================================================

Generate:

ChartOfAccounts

JournalList

JournalEntry

Ledger

TrialBalance

ProfitLoss

BalanceSheet

PaymentList

ReceiptList

=========================================================
REPORTING MODULE
=========================================================

Generate:

Inventory Reports

Sales Reports

Purchase Reports

Accounting Reports

Granite Reports

Dashboard Reports

=========================================================
COMPONENT TYPES
=========================================================

Generate reusable components:

DataTable

SearchBar

FilterPanel

Pagination

DateRangePicker

ModalForm

ConfirmDialog

StatusBadge

LoadingSpinner

ErrorBoundary

EmptyState

=========================================================
FORM COMPONENTS
=========================================================

Generate:

TextInput

NumberInput

CurrencyInput

DateInput

SelectInput

MultiSelectInput

FileUpload

BarcodeInput

TextareaInput

=========================================================
TABLE COMPONENTS
=========================================================

Support:

- pagination
- sorting
- filtering
- searching
- export
- bulk actions
- row selection

=========================================================
HOOKS
=========================================================

Generate hooks:

useProducts()

useInventory()

usePurchaseOrders()

useSalesOrders()

useInvoices()

usePermissions()

useOrganization()

=========================================================
API SERVICES
=========================================================

Generate:

api/

    authApi.js

    masterApi.js

    productApi.js

    inventoryApi.js

    purchaseApi.js

    salesApi.js

    accountingApi.js

=========================================================
STATE MANAGEMENT
=========================================================

Generate stores:

authStore

organizationStore

permissionStore

themeStore

notificationStore

Use:

React Context

or

Zustand

=========================================================
VALIDATIONS
=========================================================

Use:

React Hook Form

Zod

Generate:

productValidation.js

inventoryValidation.js

purchaseValidation.js

salesValidation.js

=========================================================
PERMISSION SYSTEM
=========================================================

Generate:

PermissionGuard

RoleGuard

BranchGuard

WarehouseGuard

Example:

<PermissionGuard permission="sales.create">

=========================================================
DASHBOARD MODULE
=========================================================

Generate:

Dashboard

Sales Summary

Purchase Summary

Inventory Summary

Granite Summary

Accounting Summary

Widgets:

Cards

Tables

Charts

Notifications

=========================================================
THEME
=========================================================

Generate:

Light Theme

Dark Theme

Responsive Layout

Mobile Layout

Tablet Layout

Desktop Layout

=========================================================
ERROR HANDLING
=========================================================

Generate:

ErrorBoundary

ApiErrorHandler

ValidationErrorHandler

UnauthorizedPage

ForbiddenPage

NotFoundPage

=========================================================
PERFORMANCE
=========================================================

Implement:

React.memo

useMemo

useCallback

lazy loading

route splitting

virtualized tables

debouncing

=========================================================
OUTPUT FORMAT
=========================================================

For every module generate:

1. Business Purpose
2. Directory Structure
3. Pages
4. Components
5. Hooks
6. Services
7. Routes
8. Validation
9. State Management
10. Permissions
11. Performance Considerations
12. Future Scalability Notes

=========================================================
FINAL GOAL
=========================================================

Generate enterprise-grade React
frontend architecture supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slab inventory
- Tile unit conversions
- Event-driven backend
- Double-entry accounting
- Millions of records

Never optimize for CRUD.

Always optimize for:

- ERP workflow correctness
- User experience
- Maintainability
- Scalability
- Performance
- Component reusability
