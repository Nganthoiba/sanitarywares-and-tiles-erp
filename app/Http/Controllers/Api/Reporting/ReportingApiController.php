<?php

namespace App\Http\Controllers\Api\Reporting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Reporting\Services\InventoryReportService;
use App\Domains\Reporting\Services\SalesReportService;
use App\Domains\Reporting\Services\PurchaseReportService;
use App\Domains\Reporting\Services\GraniteReportService;
use App\Domains\Reporting\Services\AccountingReportService;
use App\Domains\Reporting\Services\ManagementReportService;
use App\Domains\Reporting\Services\AuditReportService;
use App\Domains\Reporting\Services\DashboardService;

class ReportingApiController extends Controller
{
    public function __construct(
        protected InventoryReportService $inventoryService,
        protected SalesReportService $salesService,
        protected PurchaseReportService $purchaseService,
        protected GraniteReportService $graniteService,
        protected AccountingReportService $accountingService,
        protected ManagementReportService $managementService,
        protected AuditReportService $auditService,
        protected DashboardService $dashboardService
    ) {}

    public function getInventoryReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        if ($request->query('report_name') === 'Current Stock') {
            return response()->json($this->inventoryService->generateCurrentStockReport($filters));
        }

        return response()->json($this->inventoryService->generateStockLedgerReport($filters));
    }

    public function getSalesReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        if ($request->query('report_name') === 'Sales By Category') {
            return response()->json($this->salesService->generateSalesByCategoryReport($filters));
        }

        return response()->json($this->salesService->generateSalesRegisterReport($filters));
    }

    public function getPurchaseReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        return response()->json($this->purchaseService->generatePurchaseRegisterReport($filters));
    }

    public function getGraniteReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        return response()->json($this->graniteService->generateGraniteSlabReport($filters));
    }

    public function getAccountingReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        $reportName = $request->query('report_name');
        if ($reportName === 'Profit & Loss') {
            return response()->json($this->accountingService->generateProfitLossReport($filters));
        } elseif ($reportName === 'Balance Sheet') {
            return response()->json($this->accountingService->generateBalanceSheetReport($filters));
        }

        return response()->json($this->accountingService->generateTrialBalanceReport($filters));
    }

    public function getManagementReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        return response()->json($this->managementService->generatePerformanceReport($filters));
    }

    public function getAuditReports(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        return response()->json($this->auditService->generateReportAuditLogReport($filters));
    }

    public function getDashboardSummary(Request $request)
    {
        $filters = $request->all();
        $filters['user_id'] = $request->user()?->id ?? 1;

        return response()->json($this->dashboardService->getDashboardSummary($filters));
    }
}
