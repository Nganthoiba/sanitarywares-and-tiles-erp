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

// Public Auth / Registration Routes
Route::post('/register-organization', [OrganizationRegistrationController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/accept-invitation', [UserInvitationController::class, 'accept']);

// Authenticated & Tenant Scoped Routes
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // User Management (restricted to users with 'master.users.manage' permission)
    Route::middleware(['permission:master.users.manage'])->group(function () {
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::put('/users/{id}', [UserManagementController::class, 'update']);
        Route::delete('/users/{id}', [UserManagementController::class, 'destroy']);
        Route::post('/users/invite', [UserInvitationController::class, 'invite']);
        
        Route::get('/roles', [UserManagementController::class, 'roles']);
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
});
