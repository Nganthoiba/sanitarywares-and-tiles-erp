<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use Illuminate\Validation\Rule;

class BranchApiController extends Controller
{
    /**
     * Display a listing of the branches.
     */
    public function index(Request $request)
    {
        $branches = Branch::orderBy('name')->get();
        return response()->json($branches);
    }

    /**
     * Store a newly created branch in storage.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('branches')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })
            ],
            'is_active' => 'nullable|boolean'
        ]);

        $branch = Branch::create(array_merge($validated, [
            'organization_id' => $orgId,
            'is_active' => $request->input('is_active', true)
        ]));

        return response()->json([
            'message' => 'Branch created successfully.',
            'branch' => $branch
        ], 201);
    }

    /**
     * Display the specified branch.
     */
    public function show($id)
    {
        $branch = Branch::findOrFail($id);
        return response()->json($branch);
    }

    /**
     * Update the specified branch in storage.
     */
    public function update(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('branches')->where(function ($query) use ($orgId) {
                    return $query->where('organization_id', $orgId);
                })->ignore($branch->id)
            ],
            'is_active' => 'nullable|boolean'
        ]);

        $branch->update($validated);

        return response()->json([
            'message' => 'Branch updated successfully.',
            'branch' => $branch
        ]);
    }

    /**
     * Remove the specified branch from storage.
     */
    public function destroy($id)
    {
        $branch = Branch::findOrFail($id);

        // Prevent deletion if warehouses are linked
        $hasWarehouses = Warehouse::where('branch_id', $branch->id)->exists();
        if ($hasWarehouses) {
            return response()->json([
                'message' => 'Cannot delete branch because it contains active warehouses.'
            ], 422);
        }

        $branch->delete();

        return response()->json([
            'message' => 'Branch successfully deleted.'
        ]);
    }
}
