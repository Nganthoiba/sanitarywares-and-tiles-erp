<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\Queries\PurchaseReportQuery;
use App\Domains\Reporting\DTOs\ReportResultDTO;
use App\Domains\Reporting\Models\ReportAuditLog;

class PurchaseReportService
{
    public function __construct(
        protected PurchaseReportQuery $query
    ) {}

    public function generatePurchaseRegisterReport(array $filters): array
    {
        $startTime = microtime(true);

        $data = $this->query->getPurchaseRegister($filters);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $filters['organization_id'] ?? 1,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'purchase',
            'report_name' => 'Purchase Register Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'purchase',
            'Purchase Register Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
