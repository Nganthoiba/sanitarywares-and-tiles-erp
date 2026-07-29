<?php

namespace App\Shared\Context;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Models\User;
use Illuminate\Support\Collection;

class TenantContext
{
    protected ?Organization $organization = null;
    protected ?User $user = null;
    protected ?Branch $branch = null;
    protected ?Collection $permissions = null;

    public function setOrganization(?Organization $organization): void
    {
        $this->organization = $organization;
    }

    public function getOrganization(): ?Organization
    {
        return $this->organization;
    }

    public function getOrganizationId(): ?int
    {
        return $this->organization?->id;
    }

    public function setUser(?User $user): void
    {
        $this->user = $user;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setBranch(?Branch $branch): void
    {
        $this->branch = $branch;
    }

    public function getBranch(): ?Branch
    {
        return $this->branch;
    }

    public function getBranchId(): ?int
    {
        return $this->branch?->id;
    }

    public function setPermissions(?Collection $permissions): void
    {
        $this->permissions = $permissions;
    }

    public function getPermissions(): ?Collection
    {
        return $this->permissions;
    }
}
