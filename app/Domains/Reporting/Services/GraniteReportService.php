<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\Queries\GraniteReportQuery;
use App\Domains\Reporting\DTOs\ReportResultDTO;
use App\Domains\Reporting\Models\ReportAuditLog;

class GraniteReportService
{
    public function __construct(
        protected GraniteReportQuery $query
    ) {}

    public function generateGraniteSlabReport(array $filters): array
    {
        $startTime = microtime(true);

        $data = $this->query->getGraniteSlabs($filters);

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $filters['organization_id'] ?? 1,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'granite',
            'report_name' => 'Granite Slab Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'granite',
            'Granite Slab Report',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
