<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Domains\Master\Models\Organization;
use App\Domains\Security\Services\OrganizationRegistrationService;
use Illuminate\Http\Request;

class PlatformOrganizationController extends Controller
{
    protected OrganizationRegistrationService $registrationService;

    public function __construct(OrganizationRegistrationService $registrationService)
    {
        $this->registrationService = $registrationService;
    }

    /**
     * List all tenant organizations for Super Admin.
     */
    public function index()
    {
        $organizations = Organization::withCount('users')->get();
        return response()->json($organizations);
    }

    /**
     * Create a new organization and owner account.
     */
    public function store(Request $request)
    {
        $request->validate([
            'organization.name' => 'required|string|max:255',
            'organization.code' => 'nullable|string|max:50|unique:organizations,code',
            'owner.name' => 'required|string|max:255',
            'owner.email' => 'required|email|max:255|unique:users,email',
            'owner.password' => 'required|string|min:8',
        ]);

        $result = $this->registrationService->register(
            $request->input('organization'),
            $request->input('owner')
        );

        return response()->json([
            'message' => 'Organization created successfully.',
            'organization' => $result['organization'],
            'user' => $result['user'],
        ], 201);
    }

    /**
     * Show single organization details.
     */
    public function show($id)
    {
        $org = Organization::with(['users.roles', 'branches', 'warehouses'])->findOrFail($id);
        return response()->json($org);
    }

    /**
     * Update organization profile and settings.
     */
    public function update(Request $request, $id)
    {
        $org = Organization::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        $org->update($request->only(['name', 'legal_name', 'email', 'phone', 'is_active', 'address', 'gstin', 'pan']));

        return response()->json([
            'message' => 'Organization updated successfully.',
            'organization' => $org,
        ]);
    }

    /**
     * Suspend an organization.
     */
    public function suspend(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ], [
            'reason.required' => 'A reason for suspension is required.'
        ]);

        $org = Organization::findOrFail($id);
        $org->is_active = false;
        $org->suspension_reason = trim($request->input('reason'));
        $org->save();

        return response()->json([
            'message' => "Organization '{$org->name}' suspended successfully.",
            'organization' => $org,
        ]);
    }

    /**
     * Activate an organization.
     */
    public function activate($id)
    {
        $org = Organization::findOrFail($id);
        $org->is_active = true;
        $org->suspension_reason = null;
        $org->save();

        return response()->json([
            'message' => "Organization '{$org->name}' activated successfully.",
            'organization' => $org,
        ]);
    }
}
