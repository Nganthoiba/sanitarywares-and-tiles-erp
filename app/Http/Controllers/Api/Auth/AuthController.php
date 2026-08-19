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

        // Check if organization is active (only for tenant users)
        if ($user->organization_id !== null && (!$user->organization || !$user->organization->is_active)) {
            return response()->json([
                'message' => 'Your organization is currently inactive.'
            ], 403);
        }

        // Create Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->buildUserContext($user)
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
        return response()->json($this->buildUserContext($request->user()));
    }

    /**
     * Switch default/active role for the authenticated user.
     */
    public function switchRole(Request $request)
    {
        $request->validate([
            'role_id' => 'required|integer|exists:roles,id',
        ]);

        $user = $request->user();
        $roleId = (int) $request->input('role_id');

        if ($user->organization) {
            $context = App::make(TenantContext::class);
            $context->setUser($user);
            $context->setOrganization($user->organization);
        }

        $user->load('roles');

        $assignedRole = $user->roles->firstWhere('id', $roleId);
        if (!$assignedRole) {
            return response()->json([
                'message' => 'You are not assigned to this role.'
            ], 403);
        }

        $user->default_role_id = $roleId;
        $user->save();

        $userData = $this->buildUserContext($user);

        return response()->json([
            'message' => "Switched active role to {$assignedRole->name}.",
            'user' => $userData
        ]);
    }

    /**
     * Helper to resolve and build user auth context (roles, default_role, permissions).
     */
    protected function buildUserContext(User $user): array
    {
        if ($user->organization) {
            $context = App::make(TenantContext::class);
            $context->setUser($user);
            $context->setOrganization($user->organization);
        }

        $user->load(['roles.permissions', 'defaultRole.permissions', 'scopes.branch', 'scopes.warehouse']);

        if (!$user->default_role_id && $user->roles->isNotEmpty()) {
            $user->default_role_id = $user->roles->first()->id;
            $user->save();
            $user->load('defaultRole.permissions');
        }

        $allRoles = $user->roles;
        $activeRole = $user->defaultRole ?? $allRoles->first();

        $allowedBranches = $user->scopes->whereNotNull('branch_id')->map(fn($s) => $s->branch)->filter()->unique()->values();
        $allPermissions = $allRoles->flatMap(fn($r) => $r->permissions)->pluck('slug')->filter()->unique()->values();
        $activePermissions = $activeRole ? $activeRole->permissions->pluck('slug')->filter()->unique()->values() : collect();

        $formattedRoles = $allRoles->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'slug' => $r->slug,
            'is_default' => $r->id === ($activeRole->id ?? null),
        ])->values();

        $isSuperAdmin = $user->organization_id === null || $allRoles->contains('slug', 'super-admin');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_photo_path' => $user->profile_photo_path,
            'profile_photo_url' => $user->profile_photo_path ? asset($user->profile_photo_path) : null,
            'is_super_admin' => $isSuperAdmin,
            'default_role_id' => $user->default_role_id,
            'organization' => $user->organization ? [
                'id' => $user->organization->id,
                'name' => $user->organization->name,
            ] : null,
            'branches' => $allowedBranches,
            'roles' => $formattedRoles,
            'roles_list' => $allRoles->pluck('name')->unique()->values(),
            'active_role' => $activeRole ? [
                'id' => $activeRole->id,
                'name' => $activeRole->name,
                'slug' => $activeRole->slug,
            ] : null,
            'permissions' => $allPermissions,
            'active_permissions' => $activePermissions,
        ];
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
            $rules['new_password'] = $request->has('new_password_confirmation')
                ? 'required|string|min:8|confirmed'
                : 'required|string|min:8';
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

        if ($request->boolean('remove_photo')) {
            if ($user->profile_photo_path && file_exists(public_path($user->profile_photo_path))) {
                @unlink(public_path($user->profile_photo_path));
            }
            $user->profile_photo_path = null;
        } elseif ($request->filled('profile_photo')) {
            $photoData = $request->input('profile_photo');
            if (str_starts_with($photoData, 'data:image')) {
                preg_match('/data:image\/(.*?);base64,(.*)/', $photoData, $matches);
                if (count($matches) === 3) {
                    $ext = $matches[1] === 'jpeg' ? 'jpg' : ($matches[1] === 'svg+xml' ? 'svg' : $matches[1]);
                    $imageContent = base64_decode($matches[2]);
                    $uploadDir = public_path('uploads/avatars');
                    if (!file_exists($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }
                    if ($user->profile_photo_path && file_exists(public_path($user->profile_photo_path))) {
                        @unlink(public_path($user->profile_photo_path));
                    }
                    $filename = 'avatar_' . $user->id . '_' . time() . '.' . $ext;
                    file_put_contents($uploadDir . '/' . $filename, $imageContent);
                    $user->profile_photo_path = 'uploads/avatars/' . $filename;
                }
            }
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->buildUserContext($user->fresh())
        ]);
    }
}
