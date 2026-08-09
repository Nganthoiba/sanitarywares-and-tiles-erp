<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Inventory\Models\InventoryObject;
use Illuminate\Validation\Rule;
use DB;

class WarehouseApiController extends Controller
{
    /**
     * Display a listing of the warehouses.
     */
    public function index(Request $request)
    {
        $warehouses = Warehouse::with('branch')->orderBy('name')->get();
        return response()->json($warehouses);
    }

    /**
     * Store a newly created warehouse in storage.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'branch_id' => [
                'required',
                Rule::exists('branches', 'id')->where('organization_id', $orgId)
            ],
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('warehouses')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'type' => 'nullable|string|in:MAIN,GRANITE_YARD,TILE_STORE,SANITARY_STORE',
            'address' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        $warehouse = Warehouse::create(array_merge($validated, [
            'organization_id' => $orgId,
            'is_active' => $request->input('is_active', true)
        ]));

        return response()->json([
            'message' => 'Warehouse created successfully.',
            'warehouse' => $warehouse->load('branch')
        ], 201);
    }

    /**
     * Display the specified warehouse.
     */
    public function show($id)
    {
        $warehouse = Warehouse::with('branch')->findOrFail($id);
        return response()->json($warehouse);
    }

    /**
     * Update the specified warehouse in storage.
     */
    public function update(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'branch_id' => [
                'sometimes',
                'required',
                Rule::exists('branches', 'id')->where('organization_id', $orgId)
            ],
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('warehouses')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })->ignore($warehouse->id)
            ],
            'type' => 'nullable|string|in:MAIN,GRANITE_YARD,TILE_STORE,SANITARY_STORE',
            'address' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        $warehouse->update($validated);

        return response()->json([
            'message' => 'Warehouse updated successfully.',
            'warehouse' => $warehouse->fresh('branch')
        ]);
    }

    /**
     * Remove the specified warehouse from storage.
     */
    public function destroy($id)
    {
        $warehouse = Warehouse::findOrFail($id);

        // System checks to protect data integrity
        $hasInventory = InventoryObject::where('warehouse_id', $warehouse->id)->exists();
        if ($hasInventory) {
            return response()->json([
                'message' => 'Cannot delete warehouse because it contains active inventory objects.'
            ], 422);
        }

        $hasStorageLocations = StorageLocation::where('warehouse_id', $warehouse->id)->exists();
        if ($hasStorageLocations) {
            return response()->json([
                'message' => 'Cannot delete warehouse because it has storage locations assigned.'
            ], 422);
        }

        $warehouse->delete();

        return response()->json([
            'message' => 'Warehouse successfully deleted.'
        ]);
    }
}
