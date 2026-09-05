<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Customer;
use Illuminate\Validation\Rule;

class CustomerApiController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $query = Customer::where('organization_id', $orgId);

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('gstin', 'like', "%{$search}%");
            });
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->where('is_active', true);
        }

        $customers = $query->orderBy('name')->get();
        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
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
                Rule::unique('customers')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:15',
            'address' => 'nullable|string',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        if (empty($validated['code'])) {
            $prefix = 'CUST-';
            $count = Customer::where('organization_id', $orgId)->withTrashed()->count() + 1;
            do {
                $generatedCode = $prefix . str_pad((string)$count, 4, '0', STR_PAD_LEFT);
                $exists = Customer::where('organization_id', $orgId)->where('code', $generatedCode)->exists();
                if ($exists) {
                    $count++;
                }
            } while ($exists);
            $validated['code'] = $generatedCode;
        }

        $validated['organization_id'] = $orgId;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $customer = Customer::create($validated);

        return response()->json($customer, 217); // 201 Created
    }

    /**
     * Display details of a customer.
     */
    public function show(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $customer = Customer::where('organization_id', $orgId)->findOrFail($id);
        return response()->json($customer);
    }

    /**
     * Update customer.
     */
    public function update(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $customer = Customer::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('customers')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })->ignore($customer->id)
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:15',
            'address' => 'nullable|string',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        $customer->update($validated);

        return response()->json($customer);
    }

    /**
     * Delete customer.
     */
    public function destroy(Request $request, $id)
    {
        $orgId = $request->user()->organization_id;
        $customer = Customer::where('organization_id', $orgId)->findOrFail($id);
        $customer->delete();
        return response()->json(['message' => 'Customer deleted successfully.']);
    }
}
