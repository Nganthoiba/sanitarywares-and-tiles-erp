<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Inventory\Services\ReservationService;
use App\Domains\Inventory\Services\AllocationService;
use App\Domains\Inventory\Services\TransferService;
use App\Domains\Inventory\Services\AdjustmentService;
use App\Domains\Inventory\Services\InventoryCountService;
use App\Domains\Inventory\Services\GraniteService;
use App\Domains\Inventory\Services\ValuationService;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Models\InventoryAllocation;
use App\Domains\Inventory\Models\InventoryTransfer;
use App\Domains\Inventory\Models\InventoryAdjustment;
use App\Domains\Inventory\Models\InventoryCount;
use App\Domains\Inventory\Models\InventoryValuation;

class InventoryApiController extends Controller
{
    public function __construct(
        protected ReservationService $reservationService,
        protected AllocationService $allocationService,
        protected TransferService $transferService,
        protected AdjustmentService $adjustmentService,
        protected InventoryCountService $countService,
        protected GraniteService $graniteService,
        protected ValuationService $valuationService
    ) {}

    // 1. Reserves
    public function reserve(Request $request)
    {
        $validated = $request->validate([
            'inventory_object_id' => 'required|exists:inventory_objects,id',
            'quantity' => 'required|numeric|min:0.0001',
            'area' => 'nullable|numeric',
            'reservation_type' => 'required|string',
            'expires_at' => 'nullable|date'
        ]);

        $res = $this->reservationService->reserve(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1)
        ]));

        return response()->json(['success' => true, 'data' => $res]);
    }

    public function releaseReservation($id)
    {
        $this->reservationService->release($id);
        return response()->json(['success' => true, 'message' => 'Reservation successfully released.']);
    }

    // 2. Allocations
    public function allocate(Request $request)
    {
        $validated = $request->validate([
            'inventory_object_id' => 'required|exists:inventory_objects,id',
            'quantity' => 'required|numeric|min:0.0001',
            'area' => 'nullable|numeric',
            'reference_type' => 'nullable|string',
            'reference_id' => 'nullable|integer'
        ]);

        $alloc = $this->allocationService->allocate(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1)
        ]));

        return response()->json(['success' => true, 'data' => $alloc]);
    }

    public function completeAllocation($id)
    {
        $this->allocationService->complete($id);
        return response()->json(['success' => true, 'message' => 'Allocation completed, items dispatched.']);
    }

    // 3. Transfers
    public function initiateTransfer(Request $request)
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array',
            'items.*.inventory_object_id' => 'required|exists:inventory_objects,id',
            'items.*.quantity' => 'required|numeric|min:0.0001'
        ]);

        $trf = $this->transferService->initiateTransfer(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1),
            'user_id' => $request->user()?->id ?? 1
        ]));

        return response()->json(['success' => true, 'data' => $trf]);
    }

    public function completeTransfer($id)
    {
        $this->transferService->completeTransfer($id);
        return response()->json(['success' => true, 'message' => 'Transfer items successfully received.']);
    }

    // 4. Adjustments
    public function initiateAdjustment(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'adjustment_type' => 'required|string',
            'reason' => 'nullable|string',
            'items' => 'required|array',
            'items.*.inventory_object_id' => 'required|exists:inventory_objects,id',
            'items.*.quantity_delta' => 'required|numeric',
            'items.*.area_delta' => 'nullable|numeric'
        ]);

        $adj = $this->adjustmentService->initiateAdjustment(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1),
            'user_id' => $request->user()?->id ?? 1
        ]));

        return response()->json(['success' => true, 'data' => $adj]);
    }

    public function approveAdjustment(Request $request, $id)
    {
        $approverId = $request->user()?->id ?? 1;
        $this->adjustmentService->approveAdjustment($id, $approverId);
        return response()->json(['success' => true, 'message' => 'Stock adjustment approved and posted.']);
    }

    // 5. Physical counts
    public function initiateCount(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'count_type' => 'required|string',
            'remarks' => 'nullable|string'
        ]);

        $cnt = $this->countService->initiateCount(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1),
            'user_id' => $request->user()?->id ?? 1
        ]));

        return response()->json(['success' => true, 'data' => $cnt]);
    }

    public function updateCountItem(Request $request, $itemId)
    {
        $validated = $request->validate([
            'counted_quantity' => 'required|numeric',
            'counted_area' => 'nullable|numeric'
        ]);

        $this->countService->updateCountQuantity($itemId, $validated['counted_quantity'], $validated['counted_area'] ?? 0);
        return response()->json(['success' => true, 'message' => 'Count item updated.']);
    }

    public function approveCount(Request $request, $id)
    {
        $approverId = $request->user()?->id ?? 1;
        $this->countService->approveCount($id, $approverId);
        return response()->json(['success' => true, 'message' => 'Physical stock count verified, variations adjusted.']);
    }

    // 6. Granite slabs cuts
    public function createSlab(Request $request)
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

    public function cutSlab(Request $request, $id)
    {
        $validated = $request->validate([
            'cuts' => 'required|array',
            'cuts.*.length' => 'required|numeric',
            'cuts.*.width' => 'required|numeric',
            'cuts.*.area' => 'required|numeric'
        ]);

        $result = $this->graniteService->cutSlab($id, $validated['cuts']);
        return response()->json(['success' => true, 'data' => $result]);
    }

    // 7. Valuation
    public function getValuation(Request $request, $id)
    {
        $method = $request->query('method', 'SPECIFIC_ID');
        $val = $this->valuationService->calculateValuation($id, $method);
        return response()->json(['success' => true, 'data' => $val]);
    }
}
