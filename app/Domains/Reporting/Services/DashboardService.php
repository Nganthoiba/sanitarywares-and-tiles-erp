<?php

namespace App\Domains\Reporting\Services;

use Illuminate\Support\Facades\DB;
use App\Domains\Reporting\DTOs\ReportResultDTO;

class DashboardService
{
    public function getDashboardSummary(array $filters): array
    {
        $startTime = microtime(true);
        $orgId = $filters['organization_id'] ?? 1;

        // Sales totals
        $salesSum = DB::table('invoices')
            ->where('organization_id', $orgId)
            ->sum('total_amount') ?? 0;

        // Purchase totals
        $purchaseSum = DB::table('supplier_invoices')
            ->where('organization_id', $orgId)
            ->sum('total_amount') ?? 0;

        // Slabs on hand count
        $slabsCount = DB::table('inventory_objects')
            ->where('organization_id', $orgId)
            ->where('status', 'ON_HAND')
            ->count();

        // Active workflows count
        $workflowsCount = DB::table('workflow_instances')
            ->where('status', 'RUNNING')
            ->count();

        $data = [
            'total_sales' => (float)$salesSum,
            'total_purchases' => (float)$purchaseSum,
            'total_slabs_on_hand' => $slabsCount,
            'active_workflows' => $workflowsCount
        ];

        $executionTimeMs = (microtime(true) - $startTime) * 1000;

        $dto = new ReportResultDTO(
            'dashboard',
            'Executive Dashboard Statistics',
            $filters,
            [$data],
            $executionTimeMs,
            now()->toDateTimeString()
        );

        return $dto->toArray();
    }
}
