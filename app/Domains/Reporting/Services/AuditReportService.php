<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\Models\ReportAuditLog;
use App\Domains\Reporting\DTOs\ReportResultDTO;

class AuditReportService
{
    public function generateReportAuditLogReport(array $filters): array
    {
        $startTime = microtime(true);
        $orgId = $filters['organization_id'] ?? 1;

        $query = ReportAuditLog::with('user')
            ->where('organization_id', $orgId);

        if (!empty($filters['report_type'])) {
            $query->where('report_type', $filters['report_type']);
        }

        $data = $query->orderBy('created_at', 'desc')->get()->toArray();
        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        $dto = new ReportResultDTO(
            'audit',
            'Report Generation Audit Log',
            $filters,
            $data,
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
