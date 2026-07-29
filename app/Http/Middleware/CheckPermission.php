<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use App\Shared\Context\TenantContext;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $context = App::make(TenantContext::class);
        $user = $context->getUser();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Check if user is an Administrator (highest role within organization)
        $isAdmin = $user->roles()->where('slug', 'administrator')->exists();
        if ($isAdmin) {
            return $next($request);
        }

        // Check resolved permissions
        $permissions = $context->getPermissions();
        if ($permissions && $permissions->contains($permission)) {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden. Missing permission: ' . $permission], 403);
    }
}
