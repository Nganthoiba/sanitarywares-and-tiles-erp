<?php

namespace App\Domains\Master\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\App;

class OrganizationScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // 1. Resolve organization ID from TenantContext if bound
        if (App::bound(\App\Shared\Context\TenantContext::class)) {
            $orgId = App::make(\App\Shared\Context\TenantContext::class)->getOrganizationId();
            if ($orgId) {
                $builder->where($model->getTable() . '.organization_id', $orgId);
                return;
            }
        }

        // 2. Fall back to active authenticated user organization
        if (auth()->check()) {
            $builder->where($model->getTable() . '.organization_id', auth()->user()->organization_id);
            return;
        }

        // 3. Fall back to headers or default (useful for CLI/setup context)
        $orgId = request()->header('X-Organization-Id') ?? 1;
        $builder->where($model->getTable() . '.organization_id', $orgId);
    }
}

