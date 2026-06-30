<?php

namespace App\Domains\Reporting\Queries;

use Illuminate\Support\Facades\DB;

class PurchaseReportQuery
{
    public function getPurchaseRegister(array $filters): array
    {
        $orgId = $filters['organization_id'] ?? 1;

        $query = DB::table('supplier_invoices')
            ->join('suppliers', 'supplier_invoices.supplier_id', '=', 'suppliers.id')
            ->select(
                'supplier_invoices.id',
                'supplier_invoices.invoice_number',
                'supplier_invoices.invoice_date',
                'supplier_invoices.total_amount',
                'supplier_invoices.tax_amount',
                'supplier_invoices.status',
                'suppliers.name as supplier_name'
            )
            ->where('supplier_invoices.organization_id', $orgId);

        if (!empty($filters['start_date'])) {
            $query->whereDate('supplier_invoices.invoice_date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('supplier_invoices.invoice_date', '<=', $filters['end_date']);
        }

        return $query->orderBy('supplier_invoices.invoice_date', 'desc')->get()->toArray();
    }
}
