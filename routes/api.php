<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Inventory\GraniteSlabApiController;
use App\Http\Controllers\Api\Workflow\WorkflowController;
use App\Http\Controllers\Api\Accounting\AccountingApiController;
use App\Http\Controllers\Api\Reporting\ReportingApiController;
use App\Http\Controllers\Api\Inventory\InventoryApiController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\OrganizationRegistrationController;
use App\Http\Controllers\Api\Auth\UserInvitationController;
use App\Http\Controllers\Api\Auth\UserManagementController;
use App\Http\Controllers\Api\Auth\NavigationController;
use App\Http\Controllers\Api\Product\ProductApiController;
use App\Http\Controllers\Api\Product\ProductBatchPriceApiController;
use App\Http\Controllers\Api\Purchase\GRNApiController;
use App\Http\Controllers\Api\Purchase\PurchaseOrderApiController;
use App\Http\Controllers\Api\Master\WarehouseApiController;
use App\Http\Controllers\Api\Master\BranchApiController;
use App\Http\Controllers\Api\Master\SupplierApiController;
use App\Http\Controllers\Api\Master\StorageLocationApiController;
use App\Http\Controllers\Api\Master\CategoryApiController;
use App\Http\Controllers\Api\Master\BrandApiController;
use App\Http\Controllers\Api\Master\ManufacturerApiController;
use App\Http\Controllers\Api\Platform\PlatformOrganizationController;
use App\Http\Controllers\Api\Platform\PlatformPermissionController;
use App\Http\Controllers\Api\Platform\PlatformMenuController;


// A simple api route to test whether the api route is working or not
Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working successfully',
    ]);
});

// Public Auth / Registration Routes
Route::post('/register-organization', [OrganizationRegistrationController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/accept-invitation', [UserInvitationController::class, 'accept']);

// Authenticated Routes
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/switch-role', [AuthController::class, 'switchRole']);
    Route::get('/navigation', [NavigationController::class, 'index']);

    // Super Admin Platform Management Routes
    Route::prefix('platform')->group(function () {
        // Platform Organizations
        Route::get('/organizations', [PlatformOrganizationController::class, 'index'])->middleware('permission:platform.organizations.manage');
        Route::post('/organizations', [PlatformOrganizationController::class, 'store'])->middleware('permission:platform.organizations.manage');
        Route::get('/organizations/{id}', [PlatformOrganizationController::class, 'show'])->middleware('permission:platform.organizations.manage');
        Route::put('/organizations/{id}', [PlatformOrganizationController::class, 'update'])->middleware('permission:platform.organizations.manage');
        Route::post('/organizations/{id}/suspend', [PlatformOrganizationController::class, 'suspend'])->middleware('permission:platform.organizations.manage');
        Route::post('/organizations/{id}/activate', [PlatformOrganizationController::class, 'activate'])->middleware('permission:platform.organizations.manage');

        // Platform Permissions & Groups
        Route::get('/permissions', [PlatformPermissionController::class, 'index']);
        Route::post('/permission-groups', [PlatformPermissionController::class, 'storeGroup']);
        Route::put('/permission-groups/{id}', [PlatformPermissionController::class, 'updateGroup']);
        Route::delete('/permission-groups/{id}', [PlatformPermissionController::class, 'destroyGroup']);
        Route::post('/permissions', [PlatformPermissionController::class, 'storePermission']);
        Route::put('/permissions/{id}', [PlatformPermissionController::class, 'updatePermission']);
        Route::post('/permissions/{id}/toggle', [PlatformPermissionController::class, 'togglePermission']);
        Route::delete('/permissions/{id}', [PlatformPermissionController::class, 'destroyPermission']);
    });

    // Dedicated Platform Menu Management Routes (Restricted to platform.menus.manage)
    Route::middleware(['permission:platform.menus.manage'])->prefix('platform')->group(function () {
        Route::get('/menus', [PlatformMenuController::class, 'index']);
        Route::post('/menus', [PlatformMenuController::class, 'store']);
        Route::post('/menus/reorder', [PlatformMenuController::class, 'reorder']);
        Route::put('/menus/{id}', [PlatformMenuController::class, 'update']);
        Route::delete('/menus/{id}', [PlatformMenuController::class, 'destroy']);
    });

    // User Management (restricted to users with 'master.users.manage' permission)
    Route::middleware(['permission:master.users.manage'])->group(function () {
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::put('/users/{id}', [UserManagementController::class, 'update']);
        Route::delete('/users/{id}', [UserManagementController::class, 'destroy']);
        Route::post('/users/invite', [UserInvitationController::class, 'invite']);

        Route::get('/roles', [UserManagementController::class, 'roles']);
        Route::post('/roles', [UserManagementController::class, 'storeRole']);
        Route::put('/roles/{id}', [UserManagementController::class, 'updateRole']);
        Route::delete('/roles/{id}', [UserManagementController::class, 'destroyRole']);
        Route::get('/permissions', [UserManagementController::class, 'permissions']);
        Route::get('/branches', [UserManagementController::class, 'branches']);
        Route::get('/warehouses', [UserManagementController::class, 'warehouses']);
    });

    // Core Inventory Routes
    Route::get('/granite/slabs', [GraniteSlabApiController::class, 'index']);
    Route::get('/granite/slabs/{id}', [GraniteSlabApiController::class, 'show']);
    Route::post('/granite/slabs/{id}/cut', [GraniteSlabApiController::class, 'cut']);
    Route::post('/granite/slabs/new', [InventoryApiController::class, 'createSlab']);
    Route::post('/granite/slabs/{id}/cut', [InventoryApiController::class, 'cutSlab']); // override/new handler

    Route::post('/inventory/reserve', [InventoryApiController::class, 'reserve']);
    Route::post('/inventory/reservations/{id}/release', [InventoryApiController::class, 'releaseReservation']);
    Route::post('/inventory/allocate', [InventoryApiController::class, 'allocate']);
    Route::post('/inventory/allocations/{id}/complete', [InventoryApiController::class, 'completeAllocation']);
    Route::post('/inventory/transfers', [InventoryApiController::class, 'initiateTransfer']);
    Route::post('/inventory/transfers/{id}/complete', [InventoryApiController::class, 'completeTransfer']);
    Route::post('/inventory/adjustments', [InventoryApiController::class, 'initiateAdjustment']);
    Route::post('/inventory/adjustments/{id}/approve', [InventoryApiController::class, 'approveAdjustment']);
    Route::post('/inventory/counts', [InventoryApiController::class, 'initiateCount']);
    Route::post('/inventory/counts/items/{itemId}', [InventoryApiController::class, 'updateCountItem']);
    Route::post('/inventory/counts/{id}/approve', [InventoryApiController::class, 'approveCount']);
    Route::get('/inventory/{id}/valuation', [InventoryApiController::class, 'getValuation']);

    // Core Workflow Routes
    Route::get('/workflows/definitions', [WorkflowController::class, 'listDefinitions']);
    Route::get('/workflows/instances', [WorkflowController::class, 'listInstances']);
    Route::post('/workflows/approvals/{id}', [WorkflowController::class, 'approve']);

    // Core Accounting Routes
    Route::get('/accounting/accounts', [AccountingApiController::class, 'index']);
    Route::get('/accounting/trial-balance', [AccountingApiController::class, 'trialBalance']);
    Route::get('/accounting/profit-loss', [AccountingApiController::class, 'profitLoss']);
    Route::get('/accounting/balance-sheet', [AccountingApiController::class, 'balanceSheet']);

    // Core Reporting & BI Hub Routes
    Route::get('/reports/inventory', [ReportingApiController::class, 'getInventoryReports']);
    Route::get('/reports/purchase', [ReportingApiController::class, 'getPurchaseReports']);
    Route::get('/reports/sales', [ReportingApiController::class, 'getSalesReports']);
    Route::get('/reports/granite', [ReportingApiController::class, 'getGraniteReports']);
    Route::get('/reports/accounting', [ReportingApiController::class, 'getAccountingReports']);
    Route::get('/reports/management', [ReportingApiController::class, 'getManagementReports']);
    Route::get('/reports/audit', [ReportingApiController::class, 'getAuditReports']);
    Route::get('/reports/dashboard', [ReportingApiController::class, 'getDashboardSummary']);

    // Core Product Catalog & Entry Routes
    Route::get('/product/form-data', [ProductApiController::class, 'getFormData']);
    Route::get('/product/variants', [ProductApiController::class, 'listVariants']);
    Route::post('/product/variants', [ProductApiController::class, 'storeVariant']);
    Route::post('/product/attributes', [ProductApiController::class, 'storeAttribute']);
    Route::post('/products/{productId}/attributes', [ProductApiController::class, 'assignProductAttribute']);
    Route::post('/product/variants/{productId}/attributes', [ProductApiController::class, 'assignProductAttribute']);
    Route::delete('/products/{productId}/attributes/{attributeId}', [ProductApiController::class, 'removeProductAttribute']);
    Route::delete('/product/variants/{productId}/attributes/{attributeId}', [ProductApiController::class, 'removeProductAttribute']);
    Route::get('/product/variants/{id}', [ProductApiController::class, 'showVariant']);
    Route::put('/product/variants/{id}', [ProductApiController::class, 'updateVariant']);
    Route::get('/product/variants/{id}/conversions', [ProductApiController::class, 'listConversions']);
    Route::post('/product/variants/{id}/conversions', [ProductApiController::class, 'storeConversion']);
    Route::delete('/product/conversions/{id}', [ProductApiController::class, 'deleteConversion']);
    Route::get('/product/variants/{id}/inventory-summary', [ProductApiController::class, 'getInventorySummary']);

    // Batch Pricing Routes
    Route::get('/product-batch-prices', [ProductBatchPriceApiController::class, 'index']);
    Route::put('/product-batch-prices/{id}', [ProductBatchPriceApiController::class, 'update'])->middleware('permission:products.batch_prices.update');
    Route::post('/product-batch-prices/bulk-update', [ProductBatchPriceApiController::class, 'bulkUpdate'])->middleware('permission:products.batch_prices.update');

    // Core GRN Routes
    Route::get('/grn/form-data', [GRNApiController::class, 'getFormData']);
    Route::get('/grn', [GRNApiController::class, 'index']);
    Route::post('/grn', [GRNApiController::class, 'store']);
    Route::get('/grn/{id}', [GRNApiController::class, 'show']);
    Route::put('/grn/{id}', [GRNApiController::class, 'update']);
    Route::post('/grn/{id}/approve', [GRNApiController::class, 'approve']);

    // Core Purchase Order Routes
    Route::get('/purchase-orders/form-data', [PurchaseOrderApiController::class, 'getFormData']);
    Route::get('/purchase-orders', [PurchaseOrderApiController::class, 'index']);
    Route::post('/purchase-orders', [PurchaseOrderApiController::class, 'store'])->middleware('permission:purchase.orders.create');
    Route::get('/purchase-orders/{id}', [PurchaseOrderApiController::class, 'show']);
    Route::put('/purchase-orders/{id}', [PurchaseOrderApiController::class, 'update'])->middleware('permission:purchase.orders.create');
    Route::post('/purchase-orders/{id}/submit', [PurchaseOrderApiController::class, 'submit'])->middleware('permission:purchase.orders.create');
    Route::post('/purchase-orders/{id}/approve', [PurchaseOrderApiController::class, 'approve'])->middleware('permission:purchase.orders.approve');
    Route::post('/purchase-orders/{id}/send', [PurchaseOrderApiController::class, 'send'])->middleware('permission:purchase.orders.create');
    Route::post('/purchase-orders/{id}/cancel', [PurchaseOrderApiController::class, 'cancel']);
    Route::post('/purchase-orders/{id}/close', [PurchaseOrderApiController::class, 'close'])->middleware('permission:purchase.orders.create');

    // Warehouse CRUD Routes
    Route::apiResource('branches-crud', BranchApiController::class);
    Route::apiResource('warehouses-crud', WarehouseApiController::class);
    Route::apiResource('suppliers-crud', SupplierApiController::class);
    Route::apiResource('storage-locations-crud', StorageLocationApiController::class);
    Route::apiResource('categories-crud', CategoryApiController::class);
    Route::apiResource('brands-crud', BrandApiController::class);
    Route::post('manufacturers-crud/check-duplicates', [ManufacturerApiController::class, 'checkDuplicates']);
    Route::apiResource('manufacturers-crud', ManufacturerApiController::class);
});
