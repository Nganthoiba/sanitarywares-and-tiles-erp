<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Domains\Security\Services\OrganizationRegistrationService;
use Illuminate\Http\Request;

class OrganizationRegistrationController extends Controller
{
    protected OrganizationRegistrationService $registrationService;

    public function __construct(OrganizationRegistrationService $registrationService)
    {
        $this->registrationService = $registrationService;
    }

    /**
     * Public self-service registration endpoint.
     */
    public function register(Request $request)
    {
        $request->validate([
            // Phase 1 (Organization Details)
            'organization.name' => 'required|string|max:255',
            'organization.legal_name' => 'nullable|string|max:255',
            'organization.business_type' => 'nullable|string|max:255',
            'organization.country' => 'nullable|string|max:255',
            'organization.state' => 'nullable|string|max:255',
            'organization.city' => 'nullable|string|max:255',
            'organization.address' => 'nullable|string',
            'organization.email' => 'nullable|email|max:255',
            'organization.phone' => 'nullable|string|max:50',
            'organization.website' => 'nullable|string|max:255',
            'organization.gstin' => 'nullable|string|max:20',
            'organization.pan' => 'nullable|string|max:20',
            'organization.business_registration_number' => 'nullable|string|max:100',

            // Phase 2 (Owner Account Details)
            'owner.name' => 'required|string|max:255',
            'owner.email' => 'required|email|max:255|unique:users,email',
            'owner.password' => 'required|string|min:8|confirmed',
        ]);

        $orgData = $request->input('organization');
        $userData = $request->input('owner');

        $result = $this->registrationService->register($orgData, $userData);

        $user = $result['user'];
        $user->load('roles.permissions');
        $user->setRelation('organization', $result['organization']);
        // $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('slug')->unique()->values();
        // $user->permissions = $permissions;
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Organization and Owner Account created successfully.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'organization' => $result['organization'],
            'user' => $user,
            'user_permissions' => $result['user_permissions'],
        ], 201); // 201 standard HTTP Created status code
    }
}
