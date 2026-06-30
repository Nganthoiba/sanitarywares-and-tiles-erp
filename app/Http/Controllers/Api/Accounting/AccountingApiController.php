<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Accounting\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AccountingApiController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    /**
     * GET /api/accounting/accounts
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->input('organization_id', 1);

        $accounts = Account::with('group')
            ->where('organization_id', $orgId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $accounts
        ]);
    }

    /**
     * GET /api/accounting/trial-balance
     */
    public function trialBalance(Request $request): JsonResponse
    {
        $orgId = $request->input('organization_id', 1);

        $report = $this->reportService->getTrialBalance($orgId);

        return response()->json($report);
    }

    /**
     * GET /api/accounting/profit-loss
     */
    public function profitLoss(Request $request): JsonResponse
    {
        $orgId = $request->input('organization_id', 1);

        $report = $this->reportService->getProfitLoss($orgId);

        return response()->json($report);
    }

    /**
     * GET /api/accounting/balance-sheet
     */
    public function balanceSheet(Request $request): JsonResponse
    {
        $orgId = $request->input('organization_id', 1);

        $report = $this->reportService->getBalanceSheet($orgId);

        return response()->json($report);
    }
}
