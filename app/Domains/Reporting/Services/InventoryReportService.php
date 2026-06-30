<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\Queries\InventoryReportQuery;
use App\Domains\Reporting\DTOs\ReportResultDTO;
use App\Domains\Reporting\Models\ReportAuditLog;

class InventoryReportService
{
    public function __construct(
        protected InventoryReportQuery $query
    ) {}

    public function generateStockLedgerReport(array $filters): array
    {
        $startTime = microtime(true);

        $data = $this->query->getStockLedger($filters);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $filters['organization_id'] ?? 1,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'inventory',
            'report_name' => 'Stock Ledger Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'inventory',
            'Stock Ledger Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }

    public function generateCurrentStockReport(array $filters): array
    {
        $startTime = microtime(true);

        $data = $this->query->getCurrentStock($filters);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $filters['organization_id'] ?? 1,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'inventory',
            'report_name' => 'Current Stock Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'inventory',
            'Current Stock Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
