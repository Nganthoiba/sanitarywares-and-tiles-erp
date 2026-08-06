<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\App;
use App\Shared\Context\TenantContext;

class AuthController extends Controller
{
    /**
     * Handle user login.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $throttleKey = strtolower($credentials['email']) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => 'Too many login attempts. Locked out for ' . $seconds . ' seconds.'
            ], 429);
        }

        // Bypassing global scope for user resolution during login
        $user = User::withoutGlobalScopes()->where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 300); // lock for 5 mins if threshold met
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }

        RateLimiter::clear($throttleKey);

        // Check if organization is active
        if (!$user->organization || !$user->organization->is_active) {
            return response()->json([
                'message' => 'Your organization is currently inactive.'
            ], 403);
        }

        // Create Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Load relations and build initial context
        $user->load(['roles.permissions', 'scopes.branch', 'scopes.warehouse']);
        
        $allowedBranches = $user->scopes->whereNotNull('branch_id')->map(fn($s) => $s->branch)->unique();
        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('slug')->unique()->values();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization' => [
                    'id' => $user->organization->id,
                    'name' => $user->organization->name,
                ],
                'branches' => $allowedBranches,
                'permissions' => $permissions
            ]
        ]);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out.'
        ]);
    }

    /**
     * Get the authenticated user profile & context.
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $user->load(['roles.permissions', 'scopes.branch', 'scopes.warehouse']);

        $allowedBranches = $user->scopes->whereNotNull('branch_id')->map(fn($s) => $s->branch)->unique();
        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('slug')->unique()->values();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'organization' => [
                'id' => $user->organization->id,
                'name' => $user->organization->name,
            ],
            'branches' => $allowedBranches,
            'permissions' => $permissions
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ];

        if ($request->filled('new_password')) {
            $rules['current_password'] = 'required|string';
            $rules['new_password'] = 'required|string|min:8';
        }

        $request->validate($rules);

        if ($request->filled('new_password')) {
            if (!Hash::check($request->input('current_password'), $user->password)) {
                return response()->json([
                    'message' => 'The current password you entered is incorrect.'
                ], 422);
            }
            $user->password = Hash::make($request->input('new_password'));
        }

        $user->name = $request->input('name');
        $user->email = $request->input('email');
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }
}
