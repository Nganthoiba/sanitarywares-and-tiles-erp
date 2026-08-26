<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Domains\Security\Models\UserScope;
use App\Mail\UserInvitationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
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
            'role_ids' => 'required_without:role_id|array|min:1',
            'role_ids.*' => [
                'required',
                Rule::exists('roles', 'id')->where(function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)->orWhereNull('organization_id');
                })
            ],
            'role_id' => [
                'required_without:role_ids',
                Rule::exists('roles', 'id')->where(function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)->orWhereNull('organization_id');
                })
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

        $roleIds = $request->input('role_ids');
        if (empty($roleIds) && $request->has('role_id')) {
            $roleIds = [$request->input('role_id')];
        }

        // Perform transactional setup
        $inviteResult = DB::transaction(function () use ($request, $orgId, $roleIds) {
            $token = Str::random(40);

            // Create user
            $user = User::create([
                'organization_id' => $orgId,
                'default_role_id' => $roleIds[0] ?? null,
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make(Str::random(16)), // Temporary password
                'invitation_token' => $token,
            ]);

            // Assign multiple roles
            foreach ($roleIds as $rId) {
                $user->roles()->attach($rId, ['organization_id' => $orgId]);
            }

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

        // Dispatch invitation email
        try {
            $orgName = ($admin && $admin->organization) ? $admin->organization->name : 'Sanitary Wares & Tiles ERP';
            Mail::to($inviteResult['user']->email)->send(
                new UserInvitationMail($inviteResult['user'], $invitationLink, $orgName)
            );
        } catch (\Exception $e) {
            Log::error("Failed sending invitation email to {$inviteResult['user']->email}: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Employee invited successfully and invitation email sent.',
            'invitation_link' => $invitationLink,
            'invitation_token' => $inviteResult['token'],
            'user' => $inviteResult['user']->load(['roles', 'scopes.branch', 'scopes.warehouse'])
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
