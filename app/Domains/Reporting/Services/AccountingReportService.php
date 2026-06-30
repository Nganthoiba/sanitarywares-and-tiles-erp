<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Accounting\Services\ReportService as CoreAccountingReportService;
use App\Domains\Reporting\DTOs\ReportResultDTO;
use App\Domains\Reporting\Models\ReportAuditLog;

class AccountingReportService
{
    public function __construct(
        protected CoreAccountingReportService $coreService
    ) {}

    public function generateTrialBalanceReport(array $filters): array
    {
        $startTime = microtime(true);
        $orgId = $filters['organization_id'] ?? 1;

        $data = $this->coreService->getTrialBalance($orgId);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $orgId,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'accounting',
            'report_name' => 'Trial Balance Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'accounting',
            'Trial Balance Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }

    public function generateProfitLossReport(array $filters): array
    {
        $startTime = microtime(true);
        $orgId = $filters['organization_id'] ?? 1;

        $data = $this->coreService->getProfitLoss($orgId);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $orgId,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'accounting',
            'report_name' => 'Profit & Loss Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'accounting',
            'Profit & Loss Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }

    public function generateBalanceSheetReport(array $filters): array
    {
        $startTime = microtime(true);
        $orgId = $filters['organization_id'] ?? 1;

        $data = $this->coreService->getBalanceSheet($orgId);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $orgId,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'accounting',
            'report_name' => 'Balance Sheet Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'accounting',
            'Balance Sheet Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
