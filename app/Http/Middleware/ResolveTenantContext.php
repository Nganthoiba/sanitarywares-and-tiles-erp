<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use App\Shared\Context\TenantContext;

class ResolveTenantContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            $user = auth()->user();
            $org = $user->organization;

            $context = App::make(TenantContext::class);
            $context->setUser($user);
            $context->setOrganization($org);

            // Resolve allowed branches from user_scopes
            $allowedBranchIds = $user->scopes()
                ->whereNotNull('branch_id')
                ->pluck('branch_id')
                ->unique();

            $branchId = $request->header('X-Branch-Id') ?? $request->input('branch_id');

            if ($branchId && $allowedBranchIds->contains($branchId)) {
                $branch = \App\Domains\Master\Models\Branch::find($branchId);
            } else {
                $firstBranchId = $allowedBranchIds->first();
                $branch = $firstBranchId ? \App\Domains\Master\Models\Branch::find($firstBranchId) : null;
            }

            $context->setBranch($branch);

            // Resolve permissions from roles
            $permissions = $user->roles()
                ->with('permissions')
                ->get()
                ->flatMap(fn($role) => $role->permissions)
                ->pluck('slug')
                ->unique();

            $context->setPermissions($permissions);
        }

        return $next($request);
    }
}
