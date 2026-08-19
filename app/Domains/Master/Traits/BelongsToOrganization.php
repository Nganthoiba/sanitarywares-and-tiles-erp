<?php

namespace App\Domains\Master\Traits;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Scopes\OrganizationScope;

trait BelongsToOrganization
{
    /**
     * Boot the trait to apply global tenant scope and auto-assign organization_id.
     */
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope(new OrganizationScope());

        static::creating(function ($model) {
            // Do not auto-assign organization_id for User model (Super Admin has NULL organization_id)
            if ($model instanceof \App\Models\User) {
                return;
            }

            if (!$model->organization_id) {
                if (\Illuminate\Support\Facades\App::bound(\App\Shared\Context\TenantContext::class)) {
                    $orgId = \Illuminate\Support\Facades\App::make(\App\Shared\Context\TenantContext::class)->getOrganizationId();
                    if ($orgId) {
                        $model->organization_id = $orgId;
                        return;
                    }
                }
                if (auth()->check()) {
                    $user = auth()->user();
                    if ($user->organization_id !== null) {
                        $model->organization_id = $user->organization_id;
                        return;
                    }
                }
                $headerOrg = request()->header('X-Organization-Id');
                if ($headerOrg) {
                    $model->organization_id = $headerOrg;
                }
            }
        });
    }

    /**
     * Relationship to the Tenant Organization.
     */
    public function organization(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }
}
