<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Reporting\DTOs\ReportResultDTO;
use App\Domains\Reporting\Models\ReportAuditLog;
use Illuminate\Support\Facades\DB;

class ManagementReportService
{
    public function generatePerformanceReport(array $filters): array
    {
        $startTime = microtime(true);
        $orgId = $filters['organization_id'] ?? 1;

        // Management performance metrics: counting dispatches, invoices, and purchase records
        $totalSales = DB::table('invoices')
            ->where('organization_id', $orgId)
            ->sum('total_amount') ?? 0;

        $totalPurchases = DB::table('supplier_invoices')
            ->where('organization_id', $orgId)
            ->sum('total_amount') ?? 0;

        $data = [
            'gross_performance' => (float)$totalSales,
            'procurement_level' => (float)$totalPurchases,
            'margin_percentage' => $totalSales > 0 ? (($totalSales - $totalPurchases) / $totalSales) * 100 : 0
        ];

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        ReportAuditLog::create([
            'organization_id' => $orgId,
            'user_id' => $filters['user_id'] ?? 1,
            'report_type' => 'management',
            'report_name' => 'Branch Performance Report',
            'filters' => $filters,
            'export_type' => 'JSON',
            'execution_time_ms' => $executionTimeMs
        ]);

        $dto = new ReportResultDTO(
            'management',
            'Branch Performance Report',
            $filters,
            [$data],
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
