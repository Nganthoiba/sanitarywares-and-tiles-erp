<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Services\GraniteService;
use App\Http\Requests\CutSlabRequest;
use App\Http\Resources\InventoryObjectResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GraniteSlabApiController extends Controller
{
    public function __construct(
        protected GraniteService $graniteService
    ) {}

    /**
     * GET /api/granite/slabs
     */
    public function index(Request $request): JsonResponse
    {
        // Auto-scoped multi-tenancy based on authenticated organization or active filter
        $query = InventoryObject::where('slab_code', '!=', null);

        if ($request->has('organization_id')) {
            $query->where('organization_id', $request->input('organization_id'));
        }

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $slabs = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => InventoryObjectResource::collection($slabs),
            'meta' => [
                'current_page' => $slabs->currentPage(),
                'last_page' => $slabs->lastPage(),
                'total' => $slabs->total(),
            ]
        ]);
    }

    /**
     * GET /api/granite/slabs/{id}
     */
    public function show(int $id): JsonResponse
    {
        $slab = InventoryObject::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new InventoryObjectResource($slab),
        ]);
    }

    /**
     * POST /api/granite/slabs/{id}/cut
     */
    public function cut(CutSlabRequest $request, int $id): JsonResponse
    {
        $result = $this->graniteService->splitSlab($id, $request->input('splits'));

        return response()->json([
            'success' => true,
            'message' => 'Slab split transaction successfully processed.',
            'data' => [
                'parent' => new InventoryObjectResource($result['parent']),
                'children' => InventoryObjectResource::collection($result['children']),
            ]
        ]);
    }
}
