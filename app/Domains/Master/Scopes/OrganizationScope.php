<?php

namespace App\Domains\Master\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use App\Shared\Context\TenantContext;
use App\Models\User;

class OrganizationScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // 1. Resolve organization ID from TenantContext if bound
        if (App::bound(TenantContext::class)) {
            $orgId = App::make(TenantContext::class)->getOrganizationId();
            if ($orgId) {
                $builder->where($model->getTable() . '.organization_id', $orgId);
                return;
            }
        }

        // 2. Fall back to active authenticated user organization
        if (Auth::check()) {
            $builder->where($model->getTable() . '.organization_id', auth()->user()->organization_id);
            return;
        }

        // 3. Fall back to headers if provided
        $orgId = request()->header('X-Organization-Id');
        if ($orgId) {
            $builder->where($model->getTable() . '.organization_id', $orgId);
            return;
        }

        // Do not restrict User model queries when no tenant context or auth is active
        // so Sanctum token resolution can locate users across all organizations.
        if ($model instanceof User) {
            return;
        }

        // 4. Default fallback for other domain models in CLI/setup context
        $builder->where($model->getTable() . '.organization_id', 1);
    }
}
