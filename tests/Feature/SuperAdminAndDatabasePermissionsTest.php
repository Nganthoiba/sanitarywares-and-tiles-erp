<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use App\Domains\Security\Models\PermissionGroup;
use App\Domains\Security\Models\Menu;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminAndDatabasePermissionsTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected Role $superAdminRole;
    protected Organization $tenantOrg;
    protected User $tenantAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(\Database\Seeders\MenuSeeder::class);

        // Super Admin (organization_id = null)
        $this->superAdminRole = Role::create([
            'organization_id' => null,
            'name' => 'Super Administrator',
            'slug' => 'super-admin',
            'is_system' => true
        ]);
        $allPermissions = Permission::where('enabled', true)->pluck('id');
        $this->superAdminRole->permissions()->syncWithPivotValues($allPermissions, ['organization_id' => null]);

        $this->superAdmin = User::create([
            'organization_id' => null,
            'name' => 'Super Admin',
            'email' => 'smartnotification1@gmail.com',
            'password' => Hash::make('password123'),
            'default_role_id' => $this->superAdminRole->id,
        ]);
        $this->superAdmin->roles()->attach($this->superAdminRole->id, ['organization_id' => null]);

        // Tenant Organization & Tenant Admin
        $this->tenantOrg = Organization::create(['name' => 'Tenant Corp', 'code' => 'TC01', 'is_active' => true]);
        $tenantRole = Role::create(['organization_id' => $this->tenantOrg->id, 'name' => 'Administrator', 'slug' => 'administrator', 'is_system' => true]);
        $opPermissions = Permission::where('slug', 'not like', 'platform.%')->pluck('id');
        $tenantRole->permissions()->syncWithPivotValues($opPermissions, ['organization_id' => $this->tenantOrg->id]);

        $this->tenantAdmin = User::create([
            'organization_id' => $this->tenantOrg->id,
            'name' => 'Tenant Admin',
            'email' => 'admin@tenant.com',
            'password' => Hash::make('password123'),
            'default_role_id' => $tenantRole->id,
        ]);
        $this->tenantAdmin->roles()->attach($tenantRole->id, ['organization_id' => $this->tenantOrg->id]);
    }

    public function test_super_admin_can_login_with_null_organization_id()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'smartnotification1@gmail.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.is_super_admin', true)
            ->assertJsonPath('user.organization', null);
    }

    public function test_super_admin_can_manage_organizations()
    {
        Sanctum::actingAs($this->superAdmin);

        // List
        $listResponse = $this->getJson('/api/platform/organizations');
        $listResponse->assertStatus(200)
            ->assertJsonCount(1);

        // Create
        $createResponse = $this->postJson('/api/platform/organizations', [
            'organization' => [
                'name' => 'New Tenant Ltd',
                'code' => 'NTL01'
            ],
            'owner' => [
                'name' => 'New Owner',
                'email' => 'owner@newtenant.com',
                'password' => 'password123'
            ]
        ]);

        $createResponse->assertStatus(201);
        $newOrgId = $createResponse->json('organization.id');

        // Suspend
        $suspendResponse = $this->postJson("/api/platform/organizations/{$newOrgId}/suspend", ['reason' => 'Non-payment of subscription fees']);
        $suspendResponse->assertStatus(200)
            ->assertJsonPath('organization.is_active', false);

        // Activate
        $activateResponse = $this->postJson("/api/platform/organizations/{$newOrgId}/activate");
        $activateResponse->assertStatus(200)
            ->assertJsonPath('organization.is_active', true);
    }

    public function test_tenant_admin_cannot_access_platform_organization_management()
    {
        Sanctum::actingAs($this->tenantAdmin);

        $response = $this->getJson('/api/platform/organizations');
        $response->assertStatus(403);
    }

    public function test_super_admin_can_manage_permissions_and_groups()
    {
        Sanctum::actingAs($this->superAdmin);

        // Create Group
        $groupRes = $this->postJson('/api/platform/permission-groups', [
            'name' => 'Audit & Compliance'
        ]);
        $groupRes->assertStatus(201);
        $groupId = $groupRes->json('group.id');

        // Create Permission
        $permRes = $this->postJson('/api/platform/permissions', [
            'permission_group_id' => $groupId,
            'name' => 'audit.logs.view',
            'display_name' => 'View Audit Logs',
            'description' => 'View system audit logs'
        ]);
        $permRes->assertStatus(201);
        $permId = $permRes->json('permission.id');

        // Toggle Permission
        $toggleRes = $this->postJson("/api/platform/permissions/{$permId}/toggle");
        $toggleRes->assertStatus(200)
            ->assertJsonPath('permission.enabled', false);
    }

    public function test_super_admin_can_manage_menus()
    {
        Sanctum::actingAs($this->superAdmin);

        // List Menus
        $indexRes = $this->getJson('/api/platform/menus');
        $indexRes->assertStatus(200);

        // Create Menu
        $createRes = $this->postJson('/api/platform/menus', [
            'menu_name' => 'System Logs',
            'route_uri' => '/platform/logs',
            'icon' => 'fa-solid fa-terminal',
            'order' => 50,
            'enabled' => true
        ]);
        $createRes->assertStatus(201);
        $menuId = $createRes->json('menu.id');

        // Update Menu
        $updateRes = $this->putJson("/api/platform/menus/{$menuId}", [
            'menu_name' => 'Audit System Logs'
        ]);
        $updateRes->assertStatus(200)
            ->assertJsonPath('menu.menu_name', 'Audit System Logs');
    }

    public function test_dynamic_navigation_api_returns_authorized_menus()
    {
        $extractUris = function (array $items) use (&$extractUris) {
            $uris = collect();
            foreach ($items as $item) {
                if (!empty($item['route_uri'])) {
                    $uris->push($item['route_uri']);
                }
                if (!empty($item['children']) && is_array($item['children'])) {
                    $uris = $uris->merge($extractUris($item['children']));
                }
            }
            return $uris;
        };

        // For Super Admin: returns platform + operational menus
        Sanctum::actingAs($this->superAdmin);
        $superNav = $this->getJson('/api/navigation');
        $superNav->assertStatus(200);
        $superUris = $extractUris($superNav->json());
        $this->assertTrue($superUris->contains('/platform/organizations'));
        $this->assertTrue($superUris->contains('/inventory'));

        // For Tenant Admin: returns operational menus, hides platform management menus
        Sanctum::actingAs($this->tenantAdmin);
        $tenantNav = $this->getJson('/api/navigation');
        $tenantNav->assertStatus(200);
        $tenantUris = $extractUris($tenantNav->json());
        $this->assertFalse($tenantUris->contains('/platform/organizations'));
        $this->assertTrue($tenantUris->contains('/inventory'));
    }

    public function test_organization_registration_uses_database_permissions()
    {
        $response = $this->postJson('/api/register-organization', [
            'organization' => [
                'name' => 'Registration Test Corp',
                'code' => 'RTC01'
            ],
            'owner' => [
                'name' => 'Corp Owner',
                'email' => 'owner@regtest.com',
                'password' => 'password123',
                'password_confirmation' => 'password123'
            ]
        ]);

        $response->assertStatus(201);
        $this->assertNotEmpty($response->json('user_permissions'));
        $this->assertContains('inventory.stock.view', $response->json('user_permissions'));
    }
}
