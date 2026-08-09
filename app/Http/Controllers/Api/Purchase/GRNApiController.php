<?php

namespace App\Http\Controllers\Api\Purchase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Purchase\Services\GRNService;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Master\Models\Supplier;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Http\Requests\StoreGRNRequest;
use App\Http\Requests\UpdateGRNRequest;
use App\Http\Resources\GoodsReceiptNoteResource;
use Exception;

class GRNApiController extends Controller
{
    public function __construct(protected GRNService $grnService) {}

    /**
     * Display a listing of Goods Receipt Notes.
     */
    public function index(Request $request)
    {
        $query = GoodsReceiptNote::with(['warehouse', 'storageLocation', 'supplier', 'order.supplier']);

        // Apply filters
        if ($request->filled('supplier_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('supplier_id', $request->supplier_id)
                  ->orWhereHas('order', function ($poQuery) use ($request) {
                      $poQuery->where('supplier_id', $request->supplier_id);
                  });
            });
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('received_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('received_date', '<=', $request->date_to);
        }

        $grns = $query->orderBy('received_date', 'desc')->paginate($request->query('per_page', 15));

        return GoodsReceiptNoteResource::collection($grns);
    }

    /**
     * Store a newly created Goods Receipt Note draft in storage.
     */
    public function store(StoreGRNRequest $request)
    {
        try {
            $grn = $this->grnService->createDraft($request->validated());
            $grn->load(['items.variant', 'items.unit', 'items.slabs', 'warehouse', 'storageLocation', 'supplier', 'order']);
            return new GoodsReceiptNoteResource($grn);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specified Goods Receipt Note.
     */
    public function show($id)
    {
        $grn = GoodsReceiptNote::with(['items.variant', 'items.unit', 'items.slabs', 'warehouse', 'storageLocation', 'supplier', 'order'])
            ->findOrFail($id);
        return new GoodsReceiptNoteResource($grn);
    }

    /**
     * Update the specified Goods Receipt Note in storage (Draft only).
     */
    public function update(UpdateGRNRequest $request, $id)
    {
        try {
            $grn = $this->grnService->updateDraft($id, $request->validated());
            return new GoodsReceiptNoteResource($grn);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Approve the specified Goods Receipt Note (posting it to inventory).
     */
    public function approve($id)
    {
        try {
            $grn = $this->grnService->approveGRN($id);
            $grn->load(['items.variant', 'items.unit', 'items.slabs', 'warehouse', 'storageLocation', 'supplier', 'order']);
            return response()->json([
                'success' => true,
                'message' => 'Goods Receipt Note approved and posted to inventory successfully.',
                'data' => new GoodsReceiptNoteResource($grn)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Retrieve all form data and reference arrays required for GRN entry.
     */
    public function getFormData(Request $request)
    {
        return response()->json([
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(),
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(),
            'storage_locations' => StorageLocation::orderBy('code')->get(),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(),
            'product_variants' => ProductVariant::where('is_active', true)->with(['baseUnit', 'purchaseUnit'])->orderBy('name')->get(),
            'purchase_orders' => PurchaseOrder::with(['items.variant', 'items.unit', 'supplier'])
                ->whereIn('status', ['APPROVED', 'OPEN', 'PARTIAL'])
                ->orderBy('po_number', 'desc')
                ->get(),
        ]);
    }
}
