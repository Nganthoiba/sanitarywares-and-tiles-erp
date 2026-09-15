<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\Models\ReportAuditLog;
use App\Domains\Reporting\DTOs\ReportResultDTO;

class AuditReportService
{
    public function generateReportAuditLogReport(array $filters): array
    {
        if (empty($filters['organization_id'])) {
            throw new \InvalidArgumentException("organization_id parameter is required for reporting context.");
        }
        $orgId = (int) $filters['organization_id'];
        $startTime = microtime(true);

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
