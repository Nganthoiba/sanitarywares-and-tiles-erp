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
     * Helper to check if authenticated user has specific permission.
     */
    protected function hasPermission($user, string $permission): bool
    {
        if (!$user) return false;

        if ($user->organization_id === null || $this->isSuperAdmin($user) || $user->hasRole('administrator')) {
            return true;
        }

        $userPermissions = request()->attributes->get('user_permissions', []);
        if (in_array('*', $userPermissions) || in_array($permission, $userPermissions) || in_array('products.manufacturers.manage', $userPermissions)) {
            return true;
        }

        return $user->roles()
            ->whereHas('permissions', function ($q) use ($permission) {
                $q->whereIn('slug', [$permission, 'products.manufacturers.manage', '*']);
            })
            ->exists();
    }

    /**
     * Display a listing of the manufacturers (Global Registry).
     */
    public function index(Request $request)
    {
        $query = Manufacturer::query();

        if ($request->filled('query')) {
            $search = mb_strtolower(trim($request->input('query')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(legal_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(trade_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(cin) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(registration_number) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(address) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(registered_address) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->input('verification_status'));
        }

        $query->orderBy('name')->orderBy('legal_name');

        if ($request->boolean('all') || $request->query('paginate') === 'false') {
            return response()->json($query->get());
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * Check for potential duplicates before creation.
     */
    public function checkDuplicates(Request $request)
    {
        $name = mb_strtolower(trim($request->input('name') ?: ($request->input('legal_name') ?: '')));
        $cin = mb_strtolower(trim($request->input('cin') ?: ''));
        $regNo = mb_strtolower(trim($request->input('registration_number') ?: ''));

        $exactMatch = null;
        $possibleMatches = collect();

        // 1. Corporate Identity check by CIN / Corporate Reg No
        if (!empty($cin)) {
            $exactMatch = Manufacturer::whereRaw('LOWER(cin) = ?', [$cin])->first();
        } elseif (!empty($regNo)) {
            $exactMatch = Manufacturer::whereRaw('LOWER(registration_number) = ?', [$regNo])->first();
        }

        // 2. Name check for possible duplicates
        if (!$exactMatch && !empty($name)) {
            $possibleMatches = Manufacturer::where(function ($q) use ($name) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$name}%"])
                    ->orWhereRaw('LOWER(legal_name) LIKE ?', ["%{$name}%"])
                    ->orWhereRaw('LOWER(trade_name) LIKE ?', ["%{$name}%"]);
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
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$this->hasPermission($user, 'manufacturer.create')) {
            return response()->json([
                'message' => 'You do not have permission to create manufacturer records.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'legal_name' => 'required_without:name|nullable|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'cin' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:100',
            'business_constitution' => 'nullable|string|max:50',
            'registered_address' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'force' => 'nullable|boolean'
        ]);

        $name = trim($request->input('name') ?: ($request->input('legal_name') ?: ''));
        $legalName = trim($request->input('legal_name') ?: $name);
        $force = filter_var($request->input('force'), FILTER_VALIDATE_BOOLEAN);

        // Duplicate Check unless force = true
        if (!$force && !empty($name)) {
            $existingName = Manufacturer::where(function ($q) use ($name) {
                $q->where('name', 'like', $name)
                    ->orWhere('legal_name', 'like', $name)
                    ->orWhere('trade_name', 'like', $name);
            })->first();

            if ($existingName) {
                return response()->json([
                    'message' => 'Possible Existing Manufacturer found with similar company name.',
                    'duplicate_type' => 'possible_name',
                    'existing_manufacturer' => $existingName
                ], 422);
            }
        }

        $manufacturer = Manufacturer::create([
            'name' => $name,
            'legal_name' => $legalName,
            'trade_name' => $request->input('trade_name'),
            'cin' => $request->input('cin'),
            'registration_number' => $request->input('registration_number'),
            'business_constitution' => $request->input('business_constitution'),
            'registered_address' => $request->input('registered_address') ?: $request->input('address'),
            'address' => $request->input('registered_address') ?: $request->input('address'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'website' => $request->input('website'),
            'is_active' => $request->input('is_active', true),
            'status' => $request->input('is_active', true) ? 'ACTIVE' : 'INACTIVE',
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
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->hasPermission($user, 'manufacturer.update')) {
            return response()->json([
                'message' => 'You do not have permission to update manufacturer records.'
            ], 403);
        }

        $manufacturer = Manufacturer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'cin' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:100',
            'business_constitution' => 'nullable|string|max:50',
            'registered_address' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'verification_status' => 'nullable|string|in:UNVERIFIED,VERIFIED,REJECTED'
        ]);

        if (empty($validated['name']) && !empty($validated['legal_name'])) {
            $validated['name'] = $validated['legal_name'];
        }
        if (!empty($validated['registered_address'])) {
            $validated['address'] = $validated['registered_address'];
        }

        if ($request->has('verification_status') && $request->input('verification_status') === 'VERIFIED') {
            $validated['verified_at'] = now();
        }

        $validated['updated_by'] = $user->id;

        $manufacturer->update($validated);

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

        if (!$this->hasPermission($user, 'manufacturer.delete')) {
            return response()->json([
                'message' => 'You do not have permission to delete manufacturer records.'
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
