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
            if (!$model->organization_id) {
                if (\Illuminate\Support\Facades\App::bound(\App\Shared\Context\TenantContext::class)) {
                    $orgId = \Illuminate\Support\Facades\App::make(\App\Shared\Context\TenantContext::class)->getOrganizationId();
                    if ($orgId) {
                        $model->organization_id = $orgId;
                        return;
                    }
                }
                if (auth()->check()) {
                    $model->organization_id = auth()->user()->organization_id;
                    return;
                }
                $model->organization_id = request()->header('X-Organization-Id') ?? 1;
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
