<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Super Admin (organization_id === null or super-admin role) bypasses all permission checks
        if ($user->organization_id === null || $user->hasRole('super-admin')) {
            return $next($request);
        }

        // Platform-level permissions (platform.*) are strictly reserved for Super Admin
        /*
        if (str_starts_with($permission, 'platform.')) {
            return response()->json([
                'message' => 'Platform administration access required.'
            ], 403);
        }
        */

        // Tenant Administrator role bypasses operational tenant permissions within their organization
        if ($user->hasRole('administrator')) {
            return $next($request);
        }

        // Check assigned permissions for standard staff users
        $userPermissions = $request->attributes->get('user_permissions', []);

        if (in_array('*', $userPermissions) || in_array($permission, $userPermissions)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'You do not have permission to perform this action.',
            'required_permission' => $permission,
            'assigned_permissions' => $userPermissions,
        ], 403);
    }
}
