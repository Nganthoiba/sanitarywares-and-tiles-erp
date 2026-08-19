<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Product\Models\Product;

class ManufacturerApiController extends Controller
{
    /**
     * Helper to check if authenticated user is Super Admin.
     */
    protected function isSuperAdmin($user): bool
    {
        if (!$user) return false;

        if ($user->organization_id === null) {
            return true;
        }

        if ($user->relationLoaded('roles')) {
            if ($user->roles->contains('slug', 'super-admin')) {
                return true;
            }
        } else {
            if ($user->roles()->where('slug', 'super-admin')->exists()) {
                return true;
            }
        }

        if ($user->defaultRole && $user->defaultRole->slug === 'super-admin') {
            return true;
        }

        return false;
    }

    /**
     * Display a listing of the manufacturers (Global Registry).
     */
    public function index(Request $request)
    {
        $query = Manufacturer::query();

        if ($request->filled('query')) {
            $search = trim($request->input('query'));
            $query->where(function ($q) use ($search) {
                $q->where('legal_name', 'like', "%{$search}%")
                  ->orWhere('trade_name', 'like', "%{$search}%")
                  ->orWhere('gstin', 'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->input('verification_status'));
        }

        $manufacturers = $query->orderBy('legal_name')->get();

        return response()->json($manufacturers);
    }

    /**
     * Check for potential duplicates before creation.
     */
    public function checkDuplicates(Request $request)
    {
        $gstin = $request->input('gstin') ? strtoupper(trim(preg_replace('/\s+/', '', $request->input('gstin')))) : null;
        $name = trim($request->input('legal_name') ?: ($request->input('name') ?: ''));
        $tradeName = trim($request->input('trade_name') ?: '');

        $exactMatch = null;
        $possibleMatches = collect();

        // 1. Strong identity check by GSTIN
        if (!empty($gstin)) {
            $exactMatch = Manufacturer::where('gstin', $gstin)->first();
        }

        // 2. Name check for possible duplicates if no exact GSTIN match
        if (!$exactMatch && (!empty($name) || !empty($tradeName))) {
            $possibleMatches = Manufacturer::where(function ($q) use ($name, $tradeName) {
                if (!empty($name)) {
                    $q->where('legal_name', 'like', "%{$name}%")
                      ->orWhere('trade_name', 'like', "%{$name}%");
                }
                if (!empty($tradeName)) {
                    $q->orWhere('legal_name', 'like', "%{$tradeName}%")
                      ->orWhere('trade_name', 'like', "%{$tradeName}%");
                }
            })->take(5)->get();
        }

        return response()->json([
            'has_exact_match' => $exactMatch !== null,
            'exact_match' => $exactMatch,
            'has_possible_match' => $possibleMatches->isNotEmpty(),
            'possible_matches' => $possibleMatches,
        ]);
    }

    /**
     * Store a newly created global manufacturer.
     * RESTRICTED TO SUPER ADMIN ONLY.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$this->isSuperAdmin($user)) {
            return response()->json([
                'message' => 'Only Super Admin can manage canonical global manufacturer records.'
            ], 403);
        }

        $validated = $request->validate([
            'legal_name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'gstin' => 'nullable|string|max:20',
            'registration_number' => 'nullable|string|max:100',
            'business_constitution' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'force' => 'nullable|boolean'
        ]);

        $gstin = $request->input('gstin') ? strtoupper(trim(preg_replace('/\s+/', '', $request->input('gstin')))) : null;
        $legalName = trim($request->input('legal_name'));
        $force = filter_var($request->input('force'), FILTER_VALIDATE_BOOLEAN);

        // Duplicate Check unless force = true
        if (!$force) {
            if (!empty($gstin)) {
                $existingGstin = Manufacturer::where('gstin', $gstin)->first();
                if ($existingGstin) {
                    return response()->json([
                        'message' => 'Existing Manufacturer Found with matching GSTIN.',
                        'duplicate_type' => 'exact_gstin',
                        'existing_manufacturer' => $existingGstin
                    ], 409);
                }
            }

            $existingName = Manufacturer::where(function($q) use ($legalName) {
                $q->where('legal_name', 'like', $legalName)
                  ->orWhere('trade_name', 'like', $legalName);
            })->first();

            if ($existingName) {
                return response()->json([
                    'message' => 'Possible Existing Manufacturer found with similar name.',
                    'duplicate_type' => 'possible_name',
                    'existing_manufacturer' => $existingName
                ], 422);
            }
        }

        $manufacturer = Manufacturer::create([
            'legal_name' => $legalName,
            'trade_name' => $request->input('trade_name'),
            'gstin' => $gstin,
            'registration_number' => $request->input('registration_number'),
            'business_constitution' => $request->input('business_constitution'),
            'address' => $request->input('address'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'website' => $request->input('website'),
            'is_active' => $request->input('is_active', true),
            'verification_status' => 'UNVERIFIED',
            'created_by' => $user?->id,
        ]);

        return response()->json([
            'message' => 'Manufacturer added to global master successfully.',
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
     * RESTRICTED TO SUPER ADMIN ONLY.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->isSuperAdmin($user)) {
            return response()->json([
                'message' => 'Only Super Admin can update shared global manufacturer records.'
            ], 403);
        }

        $manufacturer = Manufacturer::findOrFail($id);

        $validated = $request->validate([
            'legal_name' => 'sometimes|required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'gstin' => 'nullable|string|max:20',
            'registration_number' => 'nullable|string|max:100',
            'business_constitution' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'verification_status' => 'nullable|string|in:UNVERIFIED,VERIFIED,REJECTED'
        ]);

        if ($request->has('verification_status') && $request->input('verification_status') === 'VERIFIED') {
            $validated['verified_at'] = now();
        }

        $validated['updated_by'] = $user->id;

        $manufacturer->update($validated);

        return response()->json([
            'message' => 'Global manufacturer record updated successfully.',
            'manufacturer' => $manufacturer
        ]);
    }

    /**
     * Remove the specified manufacturer.
     * RESTRICTED TO SUPER ADMIN ONLY.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->isSuperAdmin($user)) {
            return response()->json([
                'message' => 'Only Super Admin can delete shared global manufacturer records.'
            ], 403);
        }

        $manufacturer = Manufacturer::findOrFail($id);

        // Prevent deletion if referenced by products across any tenant organization
        $hasProducts = Product::withoutGlobalScopes()->where('manufacturer_id', $manufacturer->id)->exists();
        if ($hasProducts) {
            return response()->json([
                'message' => 'Cannot delete manufacturer because it is referenced by active products. Deactivate instead.'
            ], 422);
        }

        $manufacturer->delete();

        return response()->json([
            'message' => 'Manufacturer successfully removed from global master.'
        ]);
    }
}
