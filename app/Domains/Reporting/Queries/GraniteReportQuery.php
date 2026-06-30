<?php

namespace App\Domains\Reporting\Queries;

use Illuminate\Support\Facades\DB;

class GraniteReportQuery
{
    public function getGraniteSlabs(array $filters): array
    {
        $orgId = $filters['organization_id'] ?? 1;

        $query = DB::table('inventory_objects')
            ->join('product_variants', 'inventory_objects.product_variant_id', '=', 'product_variants.id')
            ->select(
                'inventory_objects.id',
                'inventory_objects.slab_code',
                'inventory_objects.length',
                'inventory_objects.width',
                'inventory_objects.area_on_hand',
                'inventory_objects.status',
                'product_variants.name as product_name'
            )
            ->where('inventory_objects.organization_id', $orgId)
            ->whereNotNull('inventory_objects.slab_code');

        if (!empty($filters['status'])) {
            $query->where('inventory_objects.status', $filters['status']);
        }

        return $query->orderBy('inventory_objects.slab_code', 'asc')->get()->toArray();
    }
}
