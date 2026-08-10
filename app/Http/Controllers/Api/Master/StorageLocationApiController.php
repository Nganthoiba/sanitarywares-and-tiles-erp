<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use Illuminate\Validation\Rule;

class StorageLocationApiController extends Controller
{
    /**
     * Display a listing of the storage locations.
     */
    public function index(Request $request)
    {
        $locations = StorageLocation::with('warehouse')->orderBy('code')->get();
        return response()->json($locations);
    }

    /**
     * Store a newly created storage location.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $warehouseId = $request->input('warehouse_id');

        $validated = $request->validate([
            'warehouse_id' => [
                'required',
                Rule::exists('warehouses', 'id')->where('organization_id', $orgId)
            ],
            'name' => 'required|string|max:255',
            'location_type' => 'required|string|max:50',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('storage_locations')->where(function ($query) use ($orgId, $warehouseId) {
                    return $query->where('organization_id', $orgId)->where('warehouse_id', $warehouseId);
                })
            ]
        ]);

        $location = StorageLocation::create(array_merge($validated, [
            'organization_id' => $orgId
        ]));

        return response()->json([
            'message' => 'Storage location created successfully.',
            'storage_location' => $location->load('warehouse')
        ], 201);
    }

    /**
     * Display the specified storage location.
     */
    public function show($id)
    {
        $location = StorageLocation::with('warehouse')->findOrFail($id);
        return response()->json($location);
    }

    /**
     * Update the specified storage location.
     */
    public function update(Request $request, $id)
    {
        $location = StorageLocation::findOrFail($id);
        $orgId = $request->user()->organization_id;
        $warehouseId = $request->input('warehouse_id', $location->warehouse_id);

        $validated = $request->validate([
            'warehouse_id' => [
                'sometimes',
                'required',
                Rule::exists('warehouses', 'id')->where('organization_id', $orgId)
            ],
            'name' => 'sometimes|required|string|max:255',
            'location_type' => 'sometimes|required|string|max:50',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('storage_locations')->where(function ($query) use ($orgId, $warehouseId) {
                    return $query->where('organization_id', $orgId)->where('warehouse_id', $warehouseId);
                })->ignore($location->id)
            ]
        ]);

        $location->update($validated);

        return response()->json([
            'message' => 'Storage location updated successfully.',
            'storage_location' => $location->fresh('warehouse')
        ]);
    }

    /**
     * Remove the specified storage location.
     */
    public function destroy($id)
    {
        $location = StorageLocation::findOrFail($id);

        // Check active references
        $hasGrns = GoodsReceiptNote::where('storage_location_id', $location->id)->exists();
        if ($hasGrns) {
            return response()->json([
                'message' => 'Cannot delete storage location because it is linked to Goods Receipt Notes.'
            ], 422);
        }

        $hasInventory = InventoryObject::where('storage_location_id', $location->id)->exists();
        if ($hasInventory) {
            return response()->json([
                'message' => 'Cannot delete storage location because it contains active inventory objects.'
            ], 422);
        }

        $hasMovement = InventoryMovement::where('from_storage_location_id', $location->id)
            ->orWhere('to_storage_location_id', $location->id)
            ->exists();
        if ($hasMovement) {
            return response()->json([
                'message' => 'Cannot delete storage location because it is referenced in inventory movement logs.'
            ], 422);
        }

        $location->delete();

        return response()->json([
            'message' => 'Storage location successfully deleted.'
        ]);
    }
}
