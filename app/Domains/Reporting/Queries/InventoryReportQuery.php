<?php

namespace App\Domains\Reporting\Queries;

use Illuminate\Support\Facades\DB;

class InventoryReportQuery
{
    public function getStockLedger(array $filters): array
    {
        $orgId = $filters['organization_id'] ?? 1;

        $query = DB::table('inventory_movements')
            ->join('inventory_objects', 'inventory_movements.inventory_object_id', '=', 'inventory_objects.id')
            ->join('product_variants', 'inventory_objects.product_variant_id', '=', 'product_variants.id')
            ->select(
                'inventory_movements.id',
                'inventory_movements.created_at as movement_date',
                'inventory_movements.movement_type',
                'inventory_movements.quantity_delta as quantity',
                'inventory_objects.object_code as slab_code',
                'product_variants.name as product_name',
                'product_variants.sku as product_sku'
            )
            ->where('inventory_movements.organization_id', $orgId);

        if (!empty($filters['warehouse_id'])) {
            $query->where('inventory_objects.warehouse_id', $filters['warehouse_id']);
        }
        if (!empty($filters['start_date'])) {
            $query->whereDate('inventory_movements.created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('inventory_movements.created_at', '<=', $filters['end_date']);
        }

        return $query->orderBy('inventory_movements.created_at', 'desc')->get()->toArray();
    }

    public function getCurrentStock(array $filters): array
    {
        $orgId = $filters['organization_id'] ?? 1;

        $query = DB::table('inventory_objects')
            ->join('product_variants', 'inventory_objects.product_variant_id', '=', 'product_variants.id')
            ->select(
                'product_variants.id as product_id',
                'product_variants.name as product_name',
                'product_variants.sku as product_sku',
                DB::raw('count(inventory_objects.id) as total_units'),
                DB::raw('sum(inventory_objects.area) as total_area')
            )
            ->where('inventory_objects.organization_id', $orgId)
            ->where('inventory_objects.status', 'ON_HAND');

        if (!empty($filters['warehouse_id'])) {
            $query->where('inventory_objects.warehouse_id', $filters['warehouse_id']);
        }

        return $query->groupBy('product_variants.id', 'product_variants.name', 'product_variants.sku')->get()->toArray();
    }
}
