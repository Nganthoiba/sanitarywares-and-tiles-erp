<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Domains\Security\Models\UserScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserInvitationController extends Controller
{
    /**
     * Invite a new employee to the organization.
     */
    public function invite(Request $request)
    {
        $admin = $request->user();
        $orgId = $admin->organization_id;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role_id' => [
                'required',
                Rule::exists('roles', 'id')->where('organization_id', $orgId)
            ],
            'branch_id' => [
                'required',
                Rule::exists('branches', 'id')->where('organization_id', $orgId)
            ],
            'warehouse_id' => [
                'required',
                Rule::exists('warehouses', 'id')->where('organization_id', $orgId)->where('branch_id', $request->input('branch_id'))
            ],
        ]);

        // Perform transactional setup
        $inviteResult = DB::transaction(function () use ($request, $orgId) {
            $token = Str::random(40);

            // Create user
            $user = User::create([
                'organization_id' => $orgId,
                'default_role_id' => $request->input('role_id'),
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make(Str::random(16)), // Temporary password
                'invitation_token' => $token,
            ]);

            // Assign role
            $user->roles()->attach($request->input('role_id'), ['organization_id' => $orgId]);

            // Assign scope
            UserScope::create([
                'organization_id' => $orgId,
                'user_id' => $user->id,
                'branch_id' => $request->input('branch_id'),
                'warehouse_id' => $request->input('warehouse_id'),
            ]);

            return [
                'user' => $user,
                'token' => $token
            ];
        });

        // Generate invitation link
        $invitationLink = url('/accept-invitation?token=' . $inviteResult['token']);

        return response()->json([
            'message' => 'Employee invited successfully.',
            'invitation_link' => $invitationLink,
            'invitation_token' => $inviteResult['token'],
            'user' => $inviteResult['user']
        ], 201);
    }

    /**
     * Accept the invitation and set the account password.
     */
    public function accept(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::withoutGlobalScopes()
            ->where('invitation_token', $request->input('token'))
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired invitation token.'
            ], 422);
        }

        // Activate user account
        $user->password = Hash::make($request->input('password'));
        $user->invitation_token = null;
        $user->save();

        return response()->json([
            'message' => 'Invitation accepted. You can now login to the ERP.'
        ]);
    }
}
