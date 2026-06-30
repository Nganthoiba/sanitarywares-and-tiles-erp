<?php

namespace App\Domains\Master\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $orgId = request()->header('X-Organization-Id') ?? 1;
        $builder->where($model->getTable() . '.organization_id', $orgId);
    }
}
