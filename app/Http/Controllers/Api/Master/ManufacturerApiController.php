<?php
namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Product\Models\ProductVariant;
use Illuminate\Validation\Rule;

class ManufacturerApiController extends Controller
{
    /**
     * Display a listing of the manufacturers.
     */
    public function index(Request $request)
    {
        $manufacturers = Manufacturer::orderBy('name')->get();
        return response()->json($manufacturers);
    }

    /**
     * Store a newly created manufacturer.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean'
        ]);

        $manufacturer = Manufacturer::create(array_merge($validated, [
            'organization_id' => $orgId,
            'is_active' => $request->input('is_active', true)
        ]));

        return response()->json([
            'message' => 'Manufacturer created successfully.',
            'manufacturer' => $manufacturer
        ], 201);
    }

    /**
     * Display the specified manufacturer.
     */
    public function show($id)
    {
        $manufacturer = Manufacturer::findOrFail($id);
        return response()->json($manufacturer);
    }

    /**
     * Update the specified manufacturer.
     */
    public function update(Request $request, $id)
    {
        $manufacturer = Manufacturer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean'
        ]);

        $manufacturer->update($validated);

        return response()->json([
            'message' => 'Manufacturer updated successfully.',
            'manufacturer' => $manufacturer
        ]);
    }

    /**
     * Remove the specified manufacturer.
     */
    public function destroy($id)
    {
        $manufacturer = Manufacturer::findOrFail($id);

        // Prevent deletion if linked to product variants
        $hasVariants = ProductVariant::where('manufacturer_id', $manufacturer->id)->exists();
        if ($hasVariants) {
            return response()->json([
                'message' => 'Cannot delete manufacturer because it is linked to active product variants.'
            ], 422);
        }

        $manufacturer->delete();

        return response()->json([
            'message' => 'Manufacturer successfully deleted.'
        ]);
    }
}
