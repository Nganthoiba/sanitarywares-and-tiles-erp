<?php

namespace App\Http\Controllers\Api\Purchase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Purchase\Services\PurchaseOrderService;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\PurchaseRequisition;
use App\Http\Requests\StorePORequest;
use App\Http\Requests\UpdatePORequest;
use App\Http\Resources\PurchaseOrderResource;
use Exception;

class PurchaseOrderApiController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $poService
    ) {}

    /**
     * Display a listing of Purchase Orders.
     */
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);

        // Apply filters
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('po_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('po_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        $pos = $query->orderBy('po_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->query('per_page', 15));

        return PurchaseOrderResource::collection($pos);
    }

    /**
     * Store a newly created Purchase Order draft in storage.
     */
    public function store(StorePORequest $request)
    {
        try {
            $orgId = app(\App\Shared\Context\TenantContext::class)->getOrganizationId();
            $po = $this->poService->createPO($request->validated(), $orgId);
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return new PurchaseOrderResource($po);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specified Purchase Order.
     */
    public function show($id)
    {
        $po = PurchaseOrder::with(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit'])
            ->findOrFail($id);
        return new PurchaseOrderResource($po);
    }

    /**
     * Update the specified Purchase Order in storage (Draft only).
     */
    public function update(UpdatePORequest $request, $id)
    {
        try {
            $po = $this->poService->updatePO($id, $request->validated());
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return new PurchaseOrderResource($po);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Submit the specified Purchase Order.
     */
    public function submit($id)
    {
        try {
            $po = $this->poService->submit($id);
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return response()->json([
                'success' => true,
                'message' => 'Purchase Order submitted successfully.',
                'data' => new PurchaseOrderResource($po)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Approve the specified Purchase Order.
     */
    public function approve($id)
    {
        try {
            $po = $this->poService->approve($id);
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return response()->json([
                'success' => true,
                'message' => 'Purchase Order approved successfully.',
                'data' => new PurchaseOrderResource($po)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Mark the Purchase Order as SENT.
     */
    public function send($id)
    {
        try {
            $po = $this->poService->send($id);
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return response()->json([
                'success' => true,
                'message' => 'Purchase Order sent to supplier successfully.',
                'data' => new PurchaseOrderResource($po)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Cancel the specified Purchase Order.
     */
    public function cancel($id)
    {
        try {
            $po = $this->poService->cancel($id);
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return response()->json([
                'success' => true,
                'message' => 'Purchase Order cancelled successfully.',
                'data' => new PurchaseOrderResource($po)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Close the specified Purchase Order.
     */
    public function close($id)
    {
        try {
            $po = $this->poService->close($id);
            $po->load(['branch', 'supplier', 'requisition', 'items.variant', 'items.unit', 'items.pricingUnit']);
            return response()->json([
                'success' => true,
                'message' => 'Purchase Order closed successfully.',
                'data' => new PurchaseOrderResource($po)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function getFormData(Request $request)
    {
        $orgId = app(\App\Shared\Context\TenantContext::class)->getOrganizationId();
        return response()->json([
            'suppliers' => \App\Domains\Master\Models\Supplier::where('is_active', true)->orderBy('name')->get(),
            'branches' => \App\Domains\Master\Models\Branch::orderBy('name')->get(),
            'units' => \App\Domains\Master\Models\Unit::where('is_active', true)->orderBy('name')->get(),
            'product_variants' => \App\Domains\Product\Models\ProductVariant::where('is_active', true)->with(['baseUnit', 'purchaseUnit'])->orderBy('name')->get(),
            'unit_conversions' => \App\Domains\Product\Models\UnitConversion::where('organization_id', $orgId)->get(),
            'approved_requisitions' => PurchaseRequisition::where('status', 'APPROVED')
                ->with(['items.variant.purchaseUnit', 'items.variant.baseUnit', 'items.unit', 'requester'])
                ->orderBy('pr_number', 'desc')
                ->get(),
        ]);
    }
}
