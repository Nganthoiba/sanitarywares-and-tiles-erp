<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Supplier;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\SupplierInvoice;
use App\Domains\Purchase\Models\PurchaseReturn;
use Illuminate\Validation\Rule;

class SupplierApiController extends Controller
{
    /**
     * Display a listing of the suppliers.
     */
    public function index(Request $request)
    {
        $suppliers = Supplier::orderBy('name')->get();
        return response()->json($suppliers);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('suppliers')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:15',
            'address' => 'nullable|string',
            'about_supplier' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        if (empty($validated['code'])) {
            $prefix = 'SUP-';
            $count = Supplier::where('organization_id', $orgId)->withTrashed()->count() + 1;
            do {
                $generatedCode = $prefix . str_pad((string)$count, 5, '0', STR_PAD_LEFT);
                $exists = Supplier::where('organization_id', $orgId)->where('code', $generatedCode)->exists();
                if ($exists) {
                    $count++;
                }
            } while ($exists);
            $validated['code'] = $generatedCode;
        }

        $supplier = Supplier::create(array_merge($validated, [
            'organization_id' => $orgId,
            'is_active' => $request->input('is_active', true)
        ]));

        return response()->json([
            'message' => 'Supplier created successfully.',
            'supplier' => $supplier
        ], 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show($id)
    {
        $supplier = Supplier::findOrFail($id);
        return response()->json($supplier);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('suppliers')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })->ignore($supplier->id)
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:15',
            'address' => 'nullable|string',
            'about_supplier' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully.',
            'supplier' => $supplier
        ]);
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);

        // Check active references
        $hasGrns = GoodsReceiptNote::where('supplier_id', $supplier->id)->exists();
        if ($hasGrns) {
            return response()->json([
                'message' => 'Cannot delete supplier because it is linked to active Goods Receipt Notes.'
            ], 422);
        }

        $hasPO = PurchaseOrder::where('supplier_id', $supplier->id)->exists();
        if ($hasPO) {
            return response()->json([
                'message' => 'Cannot delete supplier because it is linked to active Purchase Orders.'
            ], 422);
        }

        $hasInvoice = SupplierInvoice::where('supplier_id', $supplier->id)->exists();
        if ($hasInvoice) {
            return response()->json([
                'message' => 'Cannot delete supplier because it has active Supplier Invoices.'
            ], 422);
        }

        $hasReturn = PurchaseReturn::where('supplier_id', $supplier->id)->exists();
        if ($hasReturn) {
            return response()->json([
                'message' => 'Cannot delete supplier because it is linked to Purchase Returns.'
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier successfully deleted.'
        ]);
    }
}
