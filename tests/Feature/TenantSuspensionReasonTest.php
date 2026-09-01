<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantSuspensionReasonTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $tenantUser;
    protected Organization $tenantOrg;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PermissionSeeder::class);

        // 1. Create Super Admin User (organization_id = null)
        $superAdminRole = Role::create([
            'organization_id' => null,
            'name' => 'Super Administrator',
            'slug' => 'super-admin',
            'is_system' => true
        ]);
        $allPermissions = Permission::pluck('id');
        $superAdminRole->permissions()->syncWithPivotValues($allPermissions, ['organization_id' => null]);

        $this->superAdmin = User::create([
            'organization_id' => null,
            'name' => 'Super Admin',
            'email' => 'superadmin@erp.com',
            'password' => bcrypt('password')
        ]);
        $this->superAdmin->roles()->attach($superAdminRole->id, ['organization_id' => null]);
        $this->superAdmin->default_role_id = $superAdminRole->id;
        $this->superAdmin->save();

        // 2. Create Tenant Organization and Tenant User
        $this->tenantOrg = Organization::create([
            'name' => 'Delta Building Materials Ltd',
            'code' => 'DELTA01',
            'is_active' => true
        ]);

        $tenantRole = Role::create([
            'organization_id' => $this->tenantOrg->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_system' => true
        ]);

        $this->tenantUser = User::create([
            'organization_id' => $this->tenantOrg->id,
            'name' => 'Delta Owner',
            'email' => 'owner@deltabuilding.com',
            'password' => bcrypt('password')
        ]);
        $this->tenantUser->roles()->attach($tenantRole->id, ['organization_id' => $this->tenantOrg->id]);
        $this->tenantUser->default_role_id = $tenantRole->id;
        $this->tenantUser->save();
    }

    public function test_super_admin_cannot_suspend_organization_without_reason()
    {
        $token = $this->superAdmin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/platform/organizations/{$this->tenantOrg->id}/suspend", [
                'reason' => ''
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_super_admin_can_suspend_organization_with_reason_and_user_login_fails_with_reason()
    {
        $token = $this->superAdmin->createToken('test')->plainTextToken;
        $reason = 'Monthly subscription payment overdue for invoice #INV-2026-9081.';

        // 1. Suspend with reason
        $suspendResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/platform/organizations/{$this->tenantOrg->id}/suspend", [
                'reason' => $reason
            ]);

        $suspendResponse->assertStatus(200)
            ->assertJsonPath('organization.is_active', false)
            ->assertJsonPath('organization.suspension_reason', $reason);

        // Verify Database
        $this->assertDatabaseHas('organizations', [
            'id' => $this->tenantOrg->id,
            'is_active' => false,
            'suspension_reason' => $reason
        ]);

        // 2. Tenant user attempts to log in
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'owner@deltabuilding.com',
            'password' => 'password'
        ]);

        $loginResponse->assertStatus(403)
            ->assertJsonPath('message', 'Your organization has been suspended. Reason: ' . $reason)
            ->assertJsonPath('suspension_reason', $reason);
    }

    public function test_activating_organization_clears_suspension_reason_and_allows_login()
    {
        // Set organization to suspended state with a reason
        $reason = 'Terms of service violation review pending.';
        $this->tenantOrg->is_active = false;
        $this->tenantOrg->suspension_reason = $reason;
        $this->tenantOrg->save();

        $token = $this->superAdmin->createToken('test')->plainTextToken;

        // 1. Activate Organization
        $activateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/platform/organizations/{$this->tenantOrg->id}/activate");

        $activateResponse->assertStatus(200)
            ->assertJsonPath('organization.is_active', true)
            ->assertJsonPath('organization.suspension_reason', null);

        $this->assertDatabaseHas('organizations', [
            'id' => $this->tenantOrg->id,
            'is_active' => true,
            'suspension_reason' => null
        ]);

        // 2. Tenant user logs in successfully
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'owner@deltabuilding.com',
            'password' => 'password'
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonPath('user.email', 'owner@deltabuilding.com');
    }
}
