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
     * List sales invoices.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $filters = $request->only(['status', 'payment_status', 'search', 'per_page']);
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
}
