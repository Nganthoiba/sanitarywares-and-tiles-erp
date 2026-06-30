<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\Queries\SalesReportQuery;
use App\Domains\Reporting\DTOs\ReportResultDTO;
use App\Domains\Reporting\Models\ReportAuditLog;

class SalesReportService
{
    public function __construct(
        protected SalesReportQuery $query
    ) {}

    public function generateSalesRegisterReport(array $filters): array
    {
        $startTime = microtime(true);

        $data = $this->query->getSalesRegister($filters);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $filters['organization_id'] ?? 1,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'sales',
            'report_name' => 'Sales Register Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'sales',
            'Sales Register Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }

    public function generateSalesByCategoryReport(array $filters): array
    {
        $startTime = microtime(true);

        $data = $this->query->getSalesByCategory($filters);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $filters['organization_id'] ?? 1,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'sales',
            'report_name' => 'Sales By Category Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'sales',
            'Sales By Category Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
