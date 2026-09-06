# Graph Report - sanitarywares-and-tiles-erp  (2026-09-06)

## Corpus Check
- 429 files · ~248,281 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2277 nodes · 5122 edges · 210 communities (81 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5fd9992`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- Organization
- ReportResultDTO
- Illuminate\Database\Eloquent\Relations\BelongsTo
- Product
- composer.json
- prompt24-ProductSpecificationsOrCustomAttributesUXAndUnitSystemRefinement.md
- prompt25-RefactorManufacturer-into-a-GlobalIndependentMaster.md
- TileDimensionService
- DB
- app.jsx
- Unit
- Category
- Account
- Role
- PurchaseOrderFlowTest
- InventoryObject
- Tiles & Sanitaryware ERP System
- UOM-Aware Purchasing, Packaging, and Measured-Material Architecture
- Illuminate\Http\Request
- Warehouse
- Menu
- GRNApiController.php
- Seeders & Feature Tests
- package.json
- Controller
- InventoryMovement
- InventoryReservation
- GoodsReceiptNote
- Proposed Changes
- PostingService
- TenantContext
- PurchaseOrderApiController
- Implementation Plan — Super Admin Menu Management & Dynamic Navigation
- react
- Illuminate\Queue\SerializesModels
- Illuminate\Support\Facades\DB
- Illuminate\Database\Seeder
- Backend Models & Services
- Backend (Domain Models, Controllers, Seeders)
- RefreshSnapshotsJob
- Manufacturer
- Supplier
- Permission
- axios
- InventoryCount
- Proposed Changes
- Backend (Domain Models & API Controllers)
- Frontend UI Components
- api.php
- Illuminate\Support\Facades\Schema
- Illuminate\Database\Schema\Blueprint
- Illuminate\Database\Migrations\Migration
- ProductMasterTest
- AccountingApiController
- Role & Platform Management Components
- Illuminate\Http\Resources\Json\JsonResource
- AddProductVariantModal.jsx
- InventoryAdjustment
- StorageLocation
- AutoIncrement
- Implementation Plan — Super Admin Permission Management (`/platform/permissions`)
- ResolveTenantContext.php
- Implementation Plan - Inventory Page Redesign (/inventory)
- Key Changes Made
- SalesService
- Implementation Plan - Modern Landing Page Redesign for Tiles & Sanitaryware ERP
- RolePermission
- Accomplished Changes
- 1. Accomplished Work
- Invoice
- Implementation Plan - Purchase Order Simplification (Direct PO Primary Workflow)
- Changes Made
- prompt20-ProductEntrySimplificationAndProductMasterRefactoring.md
- prompt27-SuperAdminMenuManagement-DynamicNavigation.md
- Key Accomplishments
- Customer
- InvoiceItem
- SalesOrder
- AuthController
- 1. Summary of Changes
- Accomplishments
- PurchaseOrderList.jsx
- PurchaseRequisitionItem
- SupplierInvoiceItem
- Quotation.php
- QuotationItem
- SalesOrderItem
- SalesReturn.php
- prompt18-Multi-Unit-PurchaseAndPricingArchitecture.md
- bootstrap/app.php
- logging.php
- prompt19-UOM-Aware_Purchasing_Packaging_N_Measured-Material_Architecture.md
- prompt26-PlatformAdministrationSuperAdminDatabase-DrivenPermissionsAndDynamicNavigation.md
- GoodsReceiptItemSlab
- prompt13-Authentication, Authorization (RBAC), and Multi-Tenant Security Foundation.md
- prompt15-GRN-Inventory_Service_+_GRN-UI.md
- prompt2-erp-database-design-prompt.md
- prompt3-erp-model-generation-prompt.md
- ExampleTest
- HomePage.jsx
- BankAccount.php
- DailyLedgerSnapshot.php
- prompt14-architectural-decision.md
- prompt21-ProductCatalogUXSimplificationAndProductManagementRedesign.md
- Product Qty Unit Rate Tax Amount
- console.php
- reporting-workflow.md
- AccountType.php
- InventoryMovementType.php
- InventoryStatus.php
- MovementType.php
- InventoryType.php
- PurchaseOrderStatus.php
- PurchaseRequisitionStatus.php
- InvoiceStatus.php
- QuotationStatus.php
- SalesOrderStatus.php
- prompt17-Purchase-order-management.md
- prompt22-PurchaseOrderSimplification,AndUnitConversionAndPricingArchitectureRefactoring.md

## God Nodes (most connected - your core abstractions)
1. `Organization` - 149 edges
2. `User` - 137 edges
3. `BelongsToOrganization` - 125 edges
4. `Product` - 101 edges
5. `Category` - 75 edges
6. `Unit` - 67 edges
7. `Warehouse` - 64 edges
8. `InventoryObject` - 62 edges
9. `TestCase` - 54 edges
10. `Branch` - 53 edges

## Surprising Connections (you probably didn't know these)
- `PurchaseOrderFlowTest` --references--> `Branch`  [EXTRACTED]
  tests/Feature/PurchaseOrderFlowTest.php → app/Domains/Master/Models/Branch.php
- `StorageLocationCRUDTest` --references--> `Branch`  [EXTRACTED]
  tests/Feature/StorageLocationCRUDTest.php → app/Domains/Master/Models/Branch.php
- `UserAndRoleManagementTest` --references--> `Branch`  [EXTRACTED]
  tests/Feature/UserAndRoleManagementTest.php → app/Domains/Master/Models/Branch.php
- `CategorySpecificationTest` --references--> `Brand`  [EXTRACTED]
  tests/Feature/CategorySpecificationTest.php → app/Domains/Master/Models/Brand.php
- `ProductMasterTest` --references--> `Brand`  [EXTRACTED]
  tests/Feature/ProductMasterTest.php → app/Domains/Master/Models/Brand.php

## Import Cycles
- None detected.

## Communities (210 total, 39 thin omitted)

### Community 0 - "User"
Cohesion: 0.05
Nodes (19): User, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Foundation\Auth\User, Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, Illuminate\Notifications\Notifiable, Laravel\Sanctum\HasApiTokens, AuthenticationTest (+11 more)

### Community 1 - "Organization"
Cohesion: 0.09
Nodes (10): Journal, JournalBatch, Payment, Receipt, Organization, BelongsToOrganization, BelongsTo, Illuminate\Database\Eloquent\Model (+2 more)

### Community 2 - "ReportResultDTO"
Cohesion: 0.06
Nodes (17): App\Domains\Product\Models\ProductFamily, App\Domains\Product\Models\ProductVariant, ReportResultDTO, ReportAuditLog, GraniteReportQuery, InventoryReportQuery, PurchaseReportQuery, SalesReportQuery (+9 more)

### Community 3 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.05
Nodes (13): BankTransaction, ClosingEntry, InventoryAdjustmentItem, InventoryAllocation, InventorySnapshot, InventoryTransfer, InventoryTransferItem, OrganizationProductPricing (+5 more)

### Community 4 - "Product"
Cohesion: 0.06
Nodes (7): HasOne, Product, ProductAttributeValue, UnitConversion, ProductApiController, ProductSeeder, ProductMasterTestAdditional

### Community 5 - "composer.json"
Cohesion: 0.04
Nodes (48): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+40 more)

### Community 6 - "prompt24-ProductSpecificationsOrCustomAttributesUXAndUnitSystemRefinement.md"
Cohesion: 0.04
Nodes (47): ============================================================ 10. UNIT CONVERSION RULE, ============================================================ 11. PRODUCT-SPECIFIC CONVERSIONS, ============================================================ 12. ATTRIBUTE UNITS ARE NOT TRANSACTION UNITS, ============================================================ 13. ATTRIBUTE UNIT DISPLAY, ============================================================ 14. ATTRIBUTE VALUE INPUT, ============================================================ 15. ATTRIBUTE ASSIGNMENT, ============================================================ 16. ADD EXISTING ATTRIBUTE UI, ============================================================ 17. REMOVE ATTRIBUTE FROM PRODUCT (+39 more)

### Community 7 - "prompt25-RefactorManufacturer-into-a-GlobalIndependentMaster.md"
Cohesion: 0.04
Nodes (47): ============================================================ 10. VERIFICATION STATUS, ============================================================ 11. VERIFIED AT, ============================================================ 12. NO ORGANIZATION_ID, ============================================================ 13. REMOVE ORGANIZATION GLOBAL SCOPE, ============================================================ 14. MANUFACTURER IDENTITY, ============================================================ 15. DUPLICATE DETECTION, ============================================================ 16. POSSIBLE DUPLICATE WARNING, ============================================================ 17. WHO CAN ADD A MANUFACTURER? (+39 more)

### Community 8 - "TileDimensionService"
Cohesion: 0.06
Nodes (10): OrganizationScope, TileDimensionService, AppServiceProvider, UserFactory, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Factories\Factory, Illuminate\Database\Eloquent\Scope, Illuminate\Support\ServiceProvider (+2 more)

### Community 9 - "DB"
Cohesion: 0.08
Nodes (9): ConvertTileBoxesAction, TransferService, PurchaseOrder, PurchaseRequisition, GRNService, Collection, PurchaseOrderService, DB (+1 more)

### Community 10 - "app.jsx"
Cohesion: 0.07
Nodes (22): react-router-dom, rootEl, LedgerReports(), AcceptInvitation(), LandingPage(), Login(), RegisterOrganization(), RoleManagement() (+14 more)

### Community 11 - "Unit"
Cohesion: 0.08
Nodes (7): Brand, TaxProfile, Unit, GlobalManufacturerTest, ProductAttributeTest, ProductPricingPackagingTest, TilePiecesPerBoxTest

### Community 12 - "Category"
Cohesion: 0.08
Nodes (8): Category, BelongsToMany, BelongsToMany, ProductAttribute, CategoryApiController, CategorySpecificationSeeder, Illuminate\Foundation\Testing\DatabaseTransactions, CategorySpecificationTest

### Community 13 - "Account"
Cohesion: 0.06
Nodes (8): Account, AccountGroup, FinancialYear, JournalEntry, OpeningBalance, ReportService, Dispatch, DispatchItem

### Community 14 - "Role"
Cohesion: 0.07
Nodes (8): Role, Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Database\Eloquent\Relations\BelongsToMany, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum, SuperAdminAndDatabasePermissionsTest, UserAndRoleManagementTest

### Community 15 - "PurchaseOrderFlowTest"
Cohesion: 0.07
Nodes (4): GoodsReceiptStatus, GoodsReceiptItem, PurchaseOrderItem, PurchaseOrderFlowTest

### Community 16 - "InventoryObject"
Cohesion: 0.09
Nodes (9): CutGraniteSlabAction, InventoryBehavior, GraniteSlabCreated, GraniteSlabCut, GraniteSlabDetail, InventoryObject, HasOne, GraniteService (+1 more)

### Community 17 - "Tiles & Sanitaryware ERP System"
Cohesion: 0.06
Nodes (32): 10. Project Status & Roadmap, 1. Project Vision, 2. Target Businesses, 3. Core Business Lifecycle, 4.1 Purchase Order Lifecycle & Statuses, 4.2 Goods Receipt Note (GRN), 4.3 Direct GRN (Receiving Without PO), 4. Procurement Management (+24 more)

### Community 18 - "UOM-Aware Purchasing, Packaging, and Measured-Material Architecture"
Cohesion: 0.06
Nodes (31): 10. Granite/Marble Measured-Material Model, 11. Purchase Order Data Model, 12. GRN Data Model, 13. Inventory Data Model, 14. Pricing Calculation Model, 15. PO UI/UX Design, 16. Granite/Marble UI/UX Design, 17. PO → GRN Flow (+23 more)

### Community 19 - "Illuminate\Http\Request"
Cohesion: 0.12
Nodes (3): UserManagementController, InventoryApiController, Illuminate\Http\Request

### Community 20 - "Warehouse"
Cohesion: 0.11
Nodes (6): Branch, Warehouse, BranchApiController, WarehouseApiController, OrganizationAndUserSeeder, WarehouseCRUDTest

### Community 21 - "Menu"
Cohesion: 0.10
Nodes (3): Menu, PlatformMenuController, PlatformMenuManagementTest

### Community 22 - "GRNApiController.php"
Cohesion: 0.12
Nodes (6): GRNApiController, CutSlabRequest, StoreGRNRequest, UpdateGRNRequest, GoodsReceiptNoteResource, Illuminate\Foundation\Http\FormRequest

### Community 23 - "Seeders & Feature Tests"
Cohesion: 0.08
Nodes (24): Automated Tests, Database Migration, Frontend Components, Implementation Plan: Remove Product-Level Pricing & Commercial Information Section, Manual Verification, [MODIFY] [GlobalManufacturerTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/GlobalManufacturerTest.php), [MODIFY] [GRNFlowTest.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/tests/Feature/GRNFlowTest.php), [MODIFY] [GRNService.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Domains/Purchase/Services/GRNService.php) (+16 more)

### Community 24 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, bootstrap, react, react-dom, react-router-dom, devDependencies, axios, concurrently (+15 more)

### Community 25 - "Controller"
Cohesion: 0.12
Nodes (5): OrganizationRegistrationService, OrganizationRegistrationController, SupplierApiController, PlatformOrganizationController, Controller

### Community 26 - "InventoryMovement"
Cohesion: 0.13
Nodes (5): InventoryMovement, InventoryValuation, AllocationService, ValuationService, Illuminate\Contracts\Console\Kernel

### Community 27 - "InventoryReservation"
Cohesion: 0.17
Nodes (8): ExpireReservations, InventoryReleased, InventoryReserved, InventoryReservation, ReservationService, Carbon\Carbon, Command, Illuminate\Console\Command

### Community 28 - "GoodsReceiptNote"
Cohesion: 0.14
Nodes (3): GoodsReceiptNote, Illuminate\Support\Facades\Event, GRNFlowTest

### Community 29 - "Proposed Changes"
Cohesion: 0.10
Nodes (20): Automated Tests, Implementation Plan: Product Specifications / Custom Attributes UX & Unit System Refinement, Manual Verification, [MODIFY] [ProductApiController.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Product/ProductApiController.php), [MODIFY] [ProductAttribute.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductAttribute.php), [MODIFY] [ProductAttributeValue.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductAttributeValue.php), [MODIFY] [ProductEntry.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx), [MODIFY] [routes/api.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/routes/api.php) (+12 more)

### Community 30 - "PostingService"
Cohesion: 0.16
Nodes (3): JournalService, PostingService, InventoryService

### Community 31 - "TenantContext"
Cohesion: 0.14
Nodes (5): NavigationController, TenantContext, Illuminate\Support\Collection, Illuminate\Support\Facades\App, Illuminate\Support\Facades\RateLimiter

### Community 32 - "PurchaseOrderApiController"
Cohesion: 0.16
Nodes (4): PurchaseOrderApiController, StorePORequest, UpdatePORequest, PurchaseOrderResource

### Community 33 - "Implementation Plan — Super Admin Menu Management & Dynamic Navigation"
Cohesion: 0.10
Nodes (19): Automated Tests, Backend API Controllers & Routes, Database & Models, Frontend (React UI & Navigation), Implementation Plan — Super Admin Menu Management & Dynamic Navigation, Key Architectural Principles, Manual Verification Scenarios, [MODIFY] [app.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/app.jsx) (+11 more)

### Community 34 - "react"
Cohesion: 0.21
Nodes (10): react, SearchableSelect(), GRNForm(), GRNList(), GRNSummary(), QuickBranchModal(), QuickSupplierModal(), QuickWarehouseModal() (+2 more)

### Community 35 - "Illuminate\Queue\SerializesModels"
Cohesion: 0.19
Nodes (7): InventoryAllocated, InventoryReceived, InventoryTransferred, GoodsReceived, ReportGenerated, Illuminate\Foundation\Events\Dispatchable, Illuminate\Queue\SerializesModels

### Community 36 - "Illuminate\Support\Facades\DB"
Cohesion: 0.16
Nodes (7): Illuminate\Support\Facades\DB, Illuminate\Support\Facades\Hash, Illuminate\Support\Facades\Mail, Illuminate\Support\Str, Illuminate\Validation\Rule, Illuminate\Validation\ValidationException, Pdo\Mysql

### Community 37 - "Illuminate\Database\Seeder"
Cohesion: 0.14
Nodes (7): BrandSeeder, CategorySeeder, DatabaseSeeder, ManufacturerSeeder, MenuSeeder, SuperAdminSeeder, Illuminate\Database\Seeder

### Community 38 - "Backend Models & Services"
Cohesion: 0.11
Nodes (18): Automated Tests, Backend Models & Services, Database Migrations, [DELETE] [ProductFamily.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductFamily.php), [DELETE] [ProductVariant.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Product/Models/ProductVariant.php), Impact Analysis (PART 46 Requirements), Implementation Plan - Product Family Removal & Product Domain Simplification, Manual Verification (+10 more)

### Community 39 - "Backend (Domain Models, Controllers, Seeders)"
Cohesion: 0.11
Nodes (18): Automated Tests, Backend (Domain Models, Controllers, Seeders), Database & Migrations, Frontend Components, Implementation Plan: Refactor Manufacturer into a Global Independent Master, Manual Verification, [MODIFY] [DatabaseSeeder.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/database/seeders/DatabaseSeeder.php), [MODIFY] [Manufacturer.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Manufacturer.php) (+10 more)

### Community 40 - "RefreshSnapshotsJob"
Cohesion: 0.17
Nodes (10): PurchaseEventSubscriber, RefreshSnapshotsJob, UserInvitationMail, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldQueue, Illuminate\Events\Dispatcher, Illuminate\Foundation\Bus\Dispatchable, Illuminate\Mail\Mailable (+2 more)

### Community 42 - "Supplier"
Cohesion: 0.12
Nodes (3): Supplier, PurchaseReturn, SupplierInvoice

### Community 43 - "Permission"
Cohesion: 0.19
Nodes (4): Permission, PermissionGroup, PlatformPermissionController, PermissionSeeder

### Community 44 - "axios"
Cohesion: 0.18
Nodes (10): axios, SupplierManager(), CategoryManager(), NewSaleForm(), QuickCustomerModal(), formatHumanDate(), SalesManager(), formatHumanDate() (+2 more)

### Community 45 - "InventoryCount"
Cohesion: 0.16
Nodes (4): InventoryCountCompleted, InventoryCount, InventoryCountItem, InventoryCountService

### Community 46 - "Proposed Changes"
Cohesion: 0.12
Nodes (16): Automated Tests, Backend API Controllers & Validation, Backend Domain Services & Helper, Database Seeders & Attribute Registry, Frontend React Components, Implementation Plan - Flexible Measurement Units for Tile Dimensions, Manual Verification, [MODIFY] [AddProductVariantModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/common/AddProductVariantModal.jsx) (+8 more)

### Community 47 - "Backend (Domain Models & API Controllers)"
Cohesion: 0.12
Nodes (16): Automated Tests, Backend (Domain Models & API Controllers), Frontend (Shared Utilities & Components), Implementation Plan - Root Parent Category Recursive Resolution, Manual Verification, [MODIFY] [AddProductVariantModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/common/AddProductVariantModal.jsx), [MODIFY] [Category.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Domains/Master/Models/Category.php), [MODIFY] [CategoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Master/CategoryApiController.php) (+8 more)

### Community 48 - "Frontend UI Components"
Cohesion: 0.12
Nodes (16): Automated Tests, Backend API, Frontend UI Components, Implementation Plan - Category, Brand & Manufacturer CRUD and Quick Add, Manual Verification, [MODIFY] [api.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/routes/api.php), [MODIFY] [app.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/app.jsx), [MODIFY] [ProductEntry.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/product/ProductEntry.jsx) (+8 more)

### Community 49 - "api.php"
Cohesion: 0.12
Nodes (4): UserInvitationController, BrandApiController, ProductPricingPackagingApiController, Illuminate\Support\Facades\Route

### Community 54 - "AccountingApiController"
Cohesion: 0.23
Nodes (4): AccountingApiController, GraniteSlabApiController, InventoryObjectResource, Illuminate\Http\JsonResponse

### Community 55 - "Role & Platform Management Components"
Cohesion: 0.13
Nodes (14): Backend Middleware, Frontend Core Application, Implementation Plan - Refresh Side Navigation Bar on Role Permission Changes & Page Refresh, Manual Verification, [MODIFY] [app.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/app.jsx), [MODIFY] [MenuManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/platform/MenuManagement.jsx), [MODIFY] [PermissionManagement.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/platform/PermissionManagement.jsx), [MODIFY] [ResolveTenantContext.php](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/app/Http/Middleware/ResolveTenantContext.php) (+6 more)

### Community 56 - "Illuminate\Http\Resources\Json\JsonResource"
Cohesion: 0.19
Nodes (4): GoodsReceiptItemResource, GoodsReceiptItemSlabResource, PurchaseOrderItemResource, Illuminate\Http\Resources\Json\JsonResource

### Community 57 - "AddProductVariantModal.jsx"
Cohesion: 0.20
Nodes (8): AddProductVariantModal(), CategorySpecificationsForm(), DEFAULT_LENGTH_UNITS, UNIT_TO_MM, GRNItemsTable(), GRNSlabModal(), QuickProductVariantModal(), ProductEntry()

### Community 58 - "InventoryAdjustment"
Cohesion: 0.23
Nodes (3): InventoryAdjusted, InventoryAdjustment, AdjustmentService

### Community 59 - "StorageLocation"
Cohesion: 0.22
Nodes (3): HasMany, StorageLocation, StorageLocationApiController

### Community 60 - "AutoIncrement"
Cohesion: 0.19
Nodes (5): AutoIncrement, RoleSeeder, TaxProfileSeeder, UnitSeeder, Illuminate\Database\Console\Seeds\WithoutModelEvents

### Community 61 - "Implementation Plan — Super Admin Permission Management (`/platform/permissions`)"
Cohesion: 0.15
Nodes (12): Automated Tests, Backend Infrastructure, Frontend UI Component & Routing, Implementation Plan — Super Admin Permission Management (`/platform/permissions`), Manual & Asset Verification, [MODIFY] [app.jsx](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/resources/js/app.jsx), [MODIFY] [PlatformPermissionController.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Platform/PlatformPermissionController.php), [MODIFY] [routes/api.php](file:///home/ecourt/my-projects/sanitarywares-and-tiles-erp/routes/api.php) (+4 more)

### Community 62 - "ResolveTenantContext.php"
Cohesion: 0.26
Nodes (6): CheckPermission, RequireOrganization, ResolveTenantContext, Closure, Illuminate\Support\Facades\Auth, Symfony\Component\HttpFoundation\Response

### Community 63 - "Implementation Plan - Inventory Page Redesign (/inventory)"
Cohesion: 0.17
Nodes (11): Automated Tests, Backend (PHP / Laravel), Frontend (React / JavaScript), Implementation Plan - Inventory Page Redesign (/inventory), Manual Verification, [MODIFY] [api.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/routes/api.php), [MODIFY] [InventoryApiController.php](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/app/Http/Controllers/Api/Inventory/InventoryApiController.php), [MODIFY] [InventoryManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/inventory/InventoryManager.jsx) (+3 more)

### Community 64 - "Key Changes Made"
Cohesion: 0.17
Nodes (11): 1. Database Schema & Models, 2. Tenant Scoping & Authorization Middleware, 3. API Controllers & Routing, 4. Database Seeders, 5. Frontend Dynamic Navigation Integration, Automated Tests, Database Seed Verification, Implementation Walkthrough: Platform Administration & Database-Driven Architecture (+3 more)

### Community 65 - "SalesService"
Cohesion: 0.22
Nodes (3): SalesService, SalesApiController, LengthAwarePaginator

### Community 66 - "Implementation Plan - Modern Landing Page Redesign for Tiles & Sanitaryware ERP"
Cohesion: 0.18
Nodes (10): Automated Tests, Implementation Plan - Modern Landing Page Redesign for Tiles & Sanitaryware ERP, Manual Verification, [MODIFY] [app.css](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/css/app.css), [MODIFY] [LandingPage.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/auth/LandingPage.jsx), Proposed Changes, React Frontend Components, Styles & Aesthetics (+2 more)

### Community 68 - "Accomplished Changes"
Cohesion: 0.20
Nodes (9): 1. Database Table & Schema Migration, 2. Eloquent Model & Domain Services, 3. Permission System, 4. API Endpoints & Controller, 5. Frontend UI Management, Accomplished Changes, Frontend Asset Build, Verification Results (+1 more)

### Community 69 - "1. Accomplished Work"
Cohesion: 0.20
Nodes (9): 1.1 Database Schema, 1.2 Tenancy Scopes & Context, 1.3 Backend Services & API, 1.4 Frontend React Views (Simple & Elegant Light Theme), 1. Accomplished Work, 2.1 Backend Tests, 2.2 Frontend Build, 2. Validation & Testing (+1 more)

### Community 71 - "Implementation Plan - Purchase Order Simplification (Direct PO Primary Workflow)"
Cohesion: 0.22
Nodes (8): Automated Tests, Frontend - Purchase Order Module, Implementation Plan - Purchase Order Simplification (Direct PO Primary Workflow), Manual Verification, [MODIFY] [PurchaseOrderForm.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/purchase/PurchaseOrderForm.jsx), Proposed Changes, User Review Required, Verification Plan

### Community 72 - "Changes Made"
Cohesion: 0.22
Nodes (8): 1. Backend Controllers & API Routing, 2. Frontend CRUD Manager Pages & Sidebar Realignment, 3. Product Family Manager CRUD Operations & Alert Note, Automated Tests, Changes Made, Manual & Visual Verification, Verification Outcomes, Walkthrough - CRUD and UI Enhancements for Product Catalog

### Community 73 - "prompt20-ProductEntrySimplificationAndProductMasterRefactoring.md"
Cohesion: 0.22
Nodes (8): A. BASIC INFORMATION, B. IDENTIFICATION, C. PRODUCT TYPE, D. COMMERCIAL INFORMATION, E. SPECIFICATIONS, Example 1 — Tile, Example 2 — Sanitaryware, Example 3 — Granite

### Community 74 - "prompt27-SuperAdminMenuManagement-DynamicNavigation.md"
Cohesion: 0.22
Nodes (8): Display Order, Enabled, Icon, Menu Label \*, Menu Type \*, Parent Menu, Permission, Route URI

### Community 75 - "Key Accomplishments"
Cohesion: 0.22
Nodes (8): 1. Database & Domain Query Layer, 2. High-Performance Service Layer, 3. Background Jobs, 4. Interactive React Dashboard, Automated Test Logs (`test_reporting.php`), Key Accomplishments, Verification & Execution Checks, Walkthrough: ERP Reporting Engine Implementation

### Community 80 - "1. Summary of Changes"
Cohesion: 0.29
Nodes (6): 1.1 Database Schema, 1.2 Backend Domain Logic, 1.3 React Frontend UI (`PurchaseOrderForm.jsx`), 1. Summary of Changes, 2. Test Verification, Refactoring Walkthrough — Purchase Order Simplification

### Community 81 - "Accomplishments"
Cohesion: 0.29
Nodes (6): 1. Database Schema & Migration, 2. Domain Models & Controllers, 3. Modular Database Seeders, Accomplishments, Automated Test Results, Walkthrough — Organization-Independent Units & Modular Database Seeders

### Community 82 - "PurchaseOrderList.jsx"
Cohesion: 0.38
Nodes (4): PurchaseOrderForm(), PurchaseOrderList(), PurchaseOrderPdf(), PurchaseOrderView()

### Community 89 - "prompt18-Multi-Unit-PurchaseAndPricingArchitecture.md"
Cohesion: 0.33
Nodes (5): Granite, GRANITE/MARBLE, NORMAL PRODUCT, Sanitaryware, Tiles

### Community 90 - "bootstrap/app.php"
Cohesion: 0.40
Nodes (3): Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware

### Community 91 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 92 - "prompt19-UOM-Aware_Purchasing_Packaging_N_Measured-Material_Architecture.md"
Cohesion: 0.40
Nodes (4): 100 BOX × ₹800/BOX, 193.60 × ₹180, 193.60 SQ.FT. × ₹180, 200 × ₹180

### Community 93 - "prompt26-PlatformAdministrationSuperAdminDatabase-DrivenPermissionsAndDynamicNavigation.md"
Cohesion: 0.40
Nodes (4): GLOBAL / PLATFORM DATA, ORGANIZATION ADMIN — TENANT SPECIFIC, ORGANIZATION-SCOPED DATA, SUPER ADMIN — SYSTEM WIDE

### Community 95 - "prompt13-Authentication, Authorization (RBAC), and Multi-Tenant Security Foundation.md"
Cohesion: 0.50
Nodes (3): Architecture, Backend, Frontend

### Community 96 - "prompt15-GRN-Inventory_Service_+_GRN-UI.md"
Cohesion: 0.50
Nodes (3): ACTIONS, DYNAMIC BEHAVIOR, SUMMARY SECTION

### Community 97 - "prompt2-erp-database-design-prompt.md"
Cohesion: 0.50
Nodes (3): ERP DATABASE SCHEMA DESIGN PROMPT, Project: Tiles - Sanitary Management and Accounting System, Version: 1.0

### Community 98 - "prompt3-erp-model-generation-prompt.md"
Cohesion: 0.50
Nodes (3): ERP LARAVEL MODEL GENERATION PROMPT, Project: Tiles - Sanitary Management and Accounting System, Version: 1.0

## Knowledge Gaps
- **428 isolated node(s):** `AccountType`, `InventoryMovementType`, `InventoryStatus`, `MovementType`, `InventoryType` (+423 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 818 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Organization`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `Product`, `TileDimensionService`, `DB`, `Unit`, `Category`, `Role`, `PurchaseOrderFlowTest`, `Illuminate\Http\Request`, `Warehouse`, `Menu`, `Controller`, `GoodsReceiptNote`, `TenantContext`, `Illuminate\Support\Facades\DB`, `Illuminate\Database\Seeder`, `Supplier`, `api.php`, `ProductMasterTest`, `RolePermission`, `AuthController`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Organization` connect `Organization` to `User`, `ReportResultDTO`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `Product`, `TileDimensionService`, `DB`, `Unit`, `Category`, `Account`, `Role`, `PurchaseOrderFlowTest`, `Warehouse`, `Menu`, `Controller`, `InventoryMovement`, `GoodsReceiptNote`, `TenantContext`, `Illuminate\Support\Facades\DB`, `Illuminate\Database\Seeder`, `Supplier`, `ProductMasterTest`, `SalesService`, `SalesOrder`, `Quotation.php`, `SalesReturn.php`, `GoodsReceiptItemSlab`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Product` connect `Product` to `User`, `Organization`, `SalesService`, `Illuminate\Queue\SerializesModels`, `Illuminate\Support\Facades\DB`, `DB`, `Manufacturer`, `Unit`, `Category`, `Account`, `PurchaseOrderFlowTest`, `api.php`, `Illuminate\Http\Request`, `ProductMasterTest`, `GRNApiController.php`, `InventoryMovement`, `GoodsReceiptNote`, `PostingService`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `AccountType`, `InventoryMovementType`, `InventoryStatus` to the rest of the system?**
  _428 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.04728604728604729 - nodes in this community are weakly interconnected._
- **Should `Organization` be split into smaller, more focused modules?**
  _Cohesion score 0.08893360160965795 - nodes in this community are weakly interconnected._
- **Should `ReportResultDTO` be split into smaller, more focused modules?**
  _Cohesion score 0.06013986013986014 - nodes in this community are weakly interconnected._