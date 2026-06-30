<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Inventory\GraniteSlabApiController;
use App\Http\Controllers\Api\Workflow\WorkflowController;
use App\Http\Controllers\Api\Accounting\AccountingApiController;
use App\Http\Controllers\Api\Reporting\ReportingApiController;

Route::get('/granite/slabs', [GraniteSlabApiController::class, 'index']);
Route::get('/granite/slabs/{id}', [GraniteSlabApiController::class, 'show']);
Route::post('/granite/slabs/{id}/cut', [GraniteSlabApiController::class, 'cut']);

Route::get('/workflows/definitions', [WorkflowController::class, 'listDefinitions']);
Route::get('/workflows/instances', [WorkflowController::class, 'listInstances']);
Route::post('/workflows/approvals/{id}', [WorkflowController::class, 'approve']);

Route::get('/accounting/accounts', [AccountingApiController::class, 'index']);
Route::get('/accounting/trial-balance', [AccountingApiController::class, 'trialBalance']);
Route::get('/accounting/profit-loss', [AccountingApiController::class, 'profitLoss']);
Route::get('/accounting/balance-sheet', [AccountingApiController::class, 'balanceSheet']);

Route::get('/reports/inventory', [ReportingApiController::class, 'getInventoryReports']);
Route::get('/reports/purchase', [ReportingApiController::class, 'getPurchaseReports']);
Route::get('/reports/sales', [ReportingApiController::class, 'getSalesReports']);
Route::get('/reports/granite', [ReportingApiController::class, 'getGraniteReports']);
Route::get('/reports/accounting', [ReportingApiController::class, 'getAccountingReports']);
Route::get('/reports/management', [ReportingApiController::class, 'getManagementReports']);
Route::get('/reports/audit', [ReportingApiController::class, 'getAuditReports']);
Route::get('/reports/dashboard', [ReportingApiController::class, 'getDashboardSummary']);

// --- Inventory Optimization Options ---
use App\Http\Controllers\Api\Inventory\InventoryApiController;

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
Route::post('/granite/slabs/new', [InventoryApiController::class, 'createSlab']);
Route::post('/granite/slabs/{id}/cut', [InventoryApiController::class, 'cutSlab']); // override/new handler
Route::get('/inventory/{id}/valuation', [InventoryApiController::class, 'getValuation']);
