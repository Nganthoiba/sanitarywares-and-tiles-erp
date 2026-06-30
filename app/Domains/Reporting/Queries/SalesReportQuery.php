<?php

namespace App\Domains\Reporting\Queries;

use Illuminate\Support\Facades\DB;

class SalesReportQuery
{
    public function getSalesRegister(array $filters): array
    {
        $orgId = $filters['organization_id'] ?? 1;

        $query = DB::table('invoices')
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->select(
                'invoices.id',
                'invoices.invoice_number',
                'invoices.invoice_date',
                'invoices.total_amount',
                'invoices.tax_amount',
                'invoices.status',
                'customers.name as customer_name'
            )
            ->where('invoices.organization_id', $orgId);

        if (!empty($filters['branch_id'])) {
            $query->where('invoices.branch_id', $filters['branch_id']);
        }
        if (!empty($filters['start_date'])) {
            $query->whereDate('invoices.invoice_date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('invoices.invoice_date', '<=', $filters['end_date']);
        }

        return $query->orderBy('invoices.invoice_date', 'desc')->get()->toArray();
    }

    public function getSalesByCategory(array $filters): array
    {
        $orgId = $filters['organization_id'] ?? 1;

        return DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('product_variants', 'invoice_items.product_variant_id', '=', 'product_variants.id')
            ->join('product_families', 'product_variants.product_family_id', '=', 'product_families.id')
            ->join('categories', 'product_families.category_id', '=', 'categories.id')
            ->select(
                'categories.name as category_name',
                DB::raw('sum(invoice_items.quantity) as total_qty'),
                DB::raw('sum(invoice_items.subtotal) as total_revenue')
            )
            ->where('invoices.organization_id', $orgId)
            ->groupBy('categories.name')
            ->orderBy('total_revenue', 'desc')
            ->get()
            ->toArray();
    }
}
