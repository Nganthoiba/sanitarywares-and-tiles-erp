<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use App\Shared\Context\TenantContext;
use App\Domains\Master\Models\Branch;
use Illuminate\Support\Facades\Auth;

class ResolveTenantContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();
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
                $branch = Branch::find($branchId);
            } else {
                $firstBranchId = $allowedBranchIds->first();
                $branch = $firstBranchId ? Branch::find($firstBranchId) : null;
            }

            $context->setBranch($branch);

            // Resolve permissions from roles using 'name' column
            $permissions = $user->roles()
                ->with('permissions')
                ->get()
                ->flatMap(fn($role) => $role->permissions)
                ->pluck('name')
                ->filter()
                ->unique()
                ->toArray();

            $context->setPermissions(collect($permissions));
            $request->attributes->set('user_permissions', $permissions);
        }

        return $next($request);
    }
}
