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
            ->leftJoin('granite_slab_details', 'inventory_objects.id', '=', 'granite_slab_details.inventory_object_id')
            ->select(
                'inventory_objects.id',
                'inventory_objects.object_code as slab_code',
                'granite_slab_details.length',
                'granite_slab_details.width',
                'inventory_objects.area as area_on_hand',
                'inventory_objects.status',
                'product_variants.name as product_name'
            )
            ->where('inventory_objects.organization_id', $orgId)
            ->whereNotNull('granite_slab_details.id');

        if (!empty($filters['status'])) {
            $query->where('inventory_objects.status', $filters['status']);
        } else {
            $query->whereIn('inventory_objects.status', ['AVAILABLE', 'ON_HAND']);
        }

        return $query->orderBy('inventory_objects.object_code', 'asc')->get()->toArray();
    }
}
