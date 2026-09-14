<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Services\GraniteService;
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
        $query = InventoryObject::has('slabDetail');

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
     * POST /api/granite/slabs/new or POST /api/granite/slabs
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_variant_id' => 'required|exists:product_variants,id',
            'slab_code' => 'required|string',
            'length' => 'required|numeric',
            'width' => 'required|numeric',
            'thickness' => 'nullable|numeric',
            'area' => 'nullable|numeric',
            'finish' => 'nullable|string',
            'origin' => 'nullable|string'
        ]);

        $slab = $this->graniteService->createSlab(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1)
        ]));

        return response()->json(['success' => true, 'data' => $slab]);
    }

    /**
     * POST /api/granite/slabs/{id}/cut
     */
    public function cut(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'cuts' => 'required|array',
            'cuts.*.length' => 'required|numeric',
            'cuts.*.width' => 'required|numeric',
            'cuts.*.area' => 'required|numeric'
        ]);

        $result = $this->graniteService->cutSlab($id, $validated['cuts']);

        return response()->json([
            'success' => true,
            'message' => 'Slab cut transaction successfully processed.',
            'data' => $result
        ]);
    }
}
