<?php

namespace App\Http\Controllers\Api\Sales;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Sales\Services\SalesService;

class SalesApiController extends Controller
{
    public function __construct(
        protected SalesService $salesService
    ) {}

    /**
     * Get form data for creating sales (customers, warehouses, units, products with live stock).
     */
    public function getFormData(Request $request)
    {
        $orgId = $request->user()->organization_id;

        // if organization id is null then send unauthorized response
        if (is_null($orgId)) {
            return response()->json([
                'message' => 'You are not authorized to perform this action because you don\'t belong to any organization. Please try again later.',
            ], 401);
        }

        $formData = $this->salesService->getSalesFormData($orgId);
        return response()->json($formData);
    }

    /**
     * Store a direct counter sale invoice.
     */
    public function storeDirectSale(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'invoice_date' => 'nullable|date',
            'payment_method' => 'required|string|in:CASH,BANK,UPI,CHEQUE,CREDIT',
            'paid_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'shipping_address' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.price_basis' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0',
            'items.*.slab_ids' => 'nullable|array',
        ]);

        try {
            $invoice = $this->salesService->createDirectSale($validated, $orgId);
            return response()->json([
                'message' => 'Direct Sale Invoice created and posted successfully.',
                'invoice' => $invoice,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preview authoritative sales tax & price calculation from backend tax engine.
     * Note: Frontend calculation is display-only; backend is sole authority.
     */
    public function calculatePreview(Request $request)
    {
        $orgId = $request->user()->organization_id;
        if (is_null($orgId)) {
            return response()->json(['message' => 'Unauthorized organization context.'], 401);
        }

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'place_of_supply_state' => 'nullable|string',
            'is_tax_inclusive' => 'nullable|boolean',
            'total_discount_amount' => 'nullable|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.product_variant_id' => 'required_with:items|exists:product_variants,id',
            'items.*.quantity' => 'nullable|numeric',
            'items.*.unit_price' => 'nullable|numeric',
            'items.*.discount_amount' => 'nullable|numeric',
            'items.*.tax_rate' => 'nullable|numeric',
            'items.*.tax_category' => 'nullable|string',
        ]);

        $preview = $this->salesService->calculatePreview($validated, $orgId);
        return response()->json($preview);
    }

    /**
     * List sales invoices.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        // if organization_id is null then send unauthorize response
        if ($orgId === null) {
            return response()->json([
                'message' => 'You are not authorized to perform this action because you don\'t belong to any organization. Please try again later.',
            ], 401);
        }

        $filters = $request->only(['status', 'payment_status', 'search', 'per_page', 'start_date', 'end_date', 'from_date', 'to_date']);
        $invoices = $this->salesService->listInvoices($orgId, $filters);
        return response()->json($invoices);
    }

    /**
     * Show single invoice details.
     */
    public function show(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $invoice = $this->salesService->getInvoiceDetails((int) $id, $orgId);
        return response()->json($invoice);
    }

    // ==========================================
    // TRACK 1: MULTI-STEP SALES WORKFLOW ENDPOINTS
    // ==========================================

    /**
     * Store a Quotation
     */
    public function storeQuotation(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'nullable|exists:branches,id',
            'quotation_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            $quotation = $this->salesService->createQuotation($validated, $orgId);
            return response()->json(['message' => 'Quotation created successfully.', 'quotation' => $quotation], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * List Quotations
     */
    public function indexQuotations(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $filters = $request->only(['status', 'per_page']);
        return response()->json($this->salesService->listQuotations($orgId, $filters));
    }

    /**
     * Store a Sales Order
     */
    public function storeSalesOrder(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'nullable|exists:branches,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'so_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            $so = $this->salesService->createSalesOrder($validated, $orgId);
            return response()->json(['message' => 'Sales Order created successfully.', 'sales_order' => $so], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Convert Quotation to Sales Order
     */
    public function convertQuotationToSalesOrder(Request $request, $quotationId)
    {
        $orgId = $request->user()->organization_id;
        try {
            $so = $this->salesService->convertQuotationToSalesOrder((int) $quotationId, $orgId);
            return response()->json(['message' => 'Quotation converted to Sales Order successfully.', 'sales_order' => $so], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * List Sales Orders
     */
    public function indexSalesOrders(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $filters = $request->only(['status', 'per_page']);
        return response()->json($this->salesService->listSalesOrders($orgId, $filters));
    }

    /**
     * Reserve Stock for Sales Order
     */
    public function reserveSalesOrder(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        try {
            $reservations = $this->salesService->reserveStockForSalesOrder((int) $id, (int) $validated['warehouse_id'], $orgId);
            return response()->json(['message' => 'Stock reserved for Sales Order successfully.', 'reservations' => $reservations]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Store Dispatch
     */
    public function storeDispatch(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'dispatch_date' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        try {
            $dispatch = $this->salesService->createDispatchFromSalesOrder($validated, $orgId);
            return response()->json(['message' => 'Dispatch recorded and stock deducted successfully.', 'dispatch' => $dispatch], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * List Dispatches
     */
    public function indexDispatches(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $filters = $request->only(['status', 'per_page']);
        return response()->json($this->salesService->listDispatches($orgId, $filters));
    }

    /**
     * Create Invoice from Dispatch
     */
    public function storeInvoiceFromDispatch(Request $request, $dispatchId)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_date' => 'nullable|date',
            'payment_method' => 'nullable|string|in:CASH,BANK,UPI,CHEQUE,CREDIT',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            $invoice = $this->salesService->createInvoiceFromDispatch((int) $dispatchId, $validated, $orgId);
            return response()->json(['message' => 'Invoice generated from Dispatch successfully.', 'invoice' => $invoice], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Store Sales Return
     */
    public function storeSalesReturn(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'return_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.invoice_item_id' => 'required|exists:invoice_items,id',
            'items.*.inventory_object_id' => 'nullable|exists:inventory_objects,id',
            'items.*.quantity' => 'required|numeric|gt:0',
        ]);

        try {
            $return = $this->salesService->createSalesReturn($validated, $orgId);
            return response()->json(['message' => 'Sales Return processed successfully.', 'sales_return' => $return], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
