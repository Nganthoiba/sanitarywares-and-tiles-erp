<?php

namespace App\Domains\Master\Scopes;

use App\Domains\Security\Models\Role;
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
        // 1. Skip tenant filtering for global platform entities
        if (
            $model instanceof \App\Domains\Security\Models\Permission ||
            $model instanceof \App\Domains\Security\Models\PermissionGroup ||
            $model instanceof \App\Domains\Master\Models\Manufacturer ||
            $model instanceof \App\Domains\Master\Models\Unit ||
            $model instanceof \App\Domains\Master\Models\TaxProfile ||
            $model instanceof \App\Domains\Security\Models\Menu
        ) {
            return;
        }

        $table = $model->getTable();
        $applyTenantFilter = function (Builder $query, string $tableName, $orgId) use ($model) {
            if (
                $model instanceof \App\Domains\Master\Models\Category ||
                $model instanceof \App\Domains\Product\Models\ProductAttribute ||
                $model instanceof \App\Domains\Product\Models\ProductAttributeValue ||
                $model instanceof Role
            ) {
                $query->where(function ($q) use ($tableName, $orgId) {
                    $q->where($tableName . '.organization_id', $orgId)
                        ->orWhereNull($tableName . '.organization_id');
                });
            } else {
                $query->where($tableName . '.organization_id', $orgId);
            }
        };

        // 2. Resolve organization ID from TenantContext if bound
        if (App::bound(TenantContext::class)) {
            $context = App::make(TenantContext::class);
            $user = $context->getUser() ?? Auth::user();

            // If user is Super Admin (organization_id === null), do not apply tenant lock
            if ($user && $user->organization_id === null) {
                return;
            }

            $orgId = $context->getOrganizationId();
            if ($orgId) {
                $applyTenantFilter($builder, $table, $orgId);
                return;
            }
        }

        // 3. Fall back to active authenticated user organization
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->organization_id === null) {
                // Super Admin operating at platform level
                return;
            }
            $applyTenantFilter($builder, $table, $user->organization_id);
            return;
        }

        // 4. Fall back to header if provided
        $orgId = request()->header('X-Organization-Id');
        if ($orgId) {
            $applyTenantFilter($builder, $table, $orgId);
            return;
        }

        // 5. Default fallback: do not filter if no tenant context, auth, or header is active
        return;
    }
}
