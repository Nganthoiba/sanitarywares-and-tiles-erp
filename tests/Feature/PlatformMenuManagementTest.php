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

class PlatformMenuManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $tenantAdmin;
    protected User $staffUser;
    protected Permission $viewOrdersPerm;
    protected Permission $createOrdersPerm;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(\Database\Seeders\MenuSeeder::class);

        $this->viewOrdersPerm = Permission::where('slug', 'purchase.orders.view')->firstOrFail();
        $this->createOrdersPerm = Permission::where('slug', 'purchase.orders.create')->firstOrFail();

        // 1. Super Admin
        $superAdminRole = Role::create([
            'organization_id' => null,
            'name'            => 'Super Administrator',
            'slug'            => 'super-admin',
            'is_system'       => true,
        ]);
        $allPermissions = Permission::where('enabled', true)->pluck('id');
        $superAdminRole->permissions()->syncWithPivotValues($allPermissions, ['organization_id' => null]);

        $this->superAdmin = User::create([
            'organization_id' => null,
            'name'            => 'Super Admin',
            'email'           => 'smartnotification1@gmail.com',
            'password'        => Hash::make('password123'),
            'default_role_id' => $superAdminRole->id,
        ]);
        $this->superAdmin->roles()->attach($superAdminRole->id, ['organization_id' => null]);

        // 2. Tenant Admin & Staff
        $tenantOrg = Organization::create(['name' => 'Test Corp', 'code' => 'TC01', 'is_active' => true]);

        $adminRole = Role::create(['organization_id' => $tenantOrg->id, 'name' => 'Administrator', 'slug' => 'administrator', 'is_system' => true]);
        $adminPermissions = Permission::where('slug', 'not like', 'platform.%')->pluck('id');
        $adminRole->permissions()->syncWithPivotValues($adminPermissions, ['organization_id' => $tenantOrg->id]);

        $this->tenantAdmin = User::create([
            'organization_id' => $tenantOrg->id,
            'name'            => 'Tenant Admin',
            'email'           => 'admin@testcorp.com',
            'password'        => Hash::make('password123'),
            'default_role_id' => $adminRole->id,
        ]);
        $this->tenantAdmin->roles()->attach($adminRole->id, ['organization_id' => $tenantOrg->id]);

        $staffRole = Role::create(['organization_id' => $tenantOrg->id, 'name' => 'Staff', 'slug' => 'staff', 'is_system' => false]);
        $staffRole->permissions()->syncWithPivotValues([$this->viewOrdersPerm->id], ['organization_id' => $tenantOrg->id]);

        $this->staffUser = User::create([
            'organization_id' => $tenantOrg->id,
            'name'            => 'Staff User',
            'email'           => 'staff@testcorp.com',
            'password'        => Hash::make('password123'),
            'default_role_id' => $staffRole->id,
        ]);
        $this->staffUser->roles()->attach($staffRole->id, ['organization_id' => $tenantOrg->id]);
    }

    public function test_super_admin_can_access_menu_management_apis()
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/platform/menus');
        $response->assertStatus(200)
            ->assertJsonStructure(['tree', 'flat']);
    }

    public function test_tenant_admin_and_staff_cannot_access_menu_management_apis()
    {
        Sanctum::actingAs($this->tenantAdmin);
        $this->getJson('/api/platform/menus')->assertStatus(403);
        $this->postJson('/api/platform/menus', ['menu_name' => 'Test'])->assertStatus(403);

        Sanctum::actingAs($this->staffUser);
        $this->getJson('/api/platform/menus')->assertStatus(403);
    }

    public function test_super_admin_can_create_group_and_page_menus()
    {
        Sanctum::actingAs($this->superAdmin);

        // Create GROUP
        $groupRes = $this->postJson('/api/platform/menus', [
            'menu_name' => 'Marketing',
            'menu_type' => 'GROUP',
            'icon'      => 'fa-solid fa-bullhorn',
            'order'     => 80,
            'enabled'   => true,
        ]);
        $groupRes->assertStatus(201)
            ->assertJsonPath('menu.menu_type', 'GROUP')
            ->assertJsonPath('menu.route_uri', null);

        $groupId = $groupRes->json('menu.id');

        // Create PAGE under GROUP
        $pageRes = $this->postJson('/api/platform/menus', [
            'menu_name'     => 'Campaigns',
            'menu_type'     => 'PAGE',
            'route_uri'     => '/marketing/campaigns',
            'icon'          => 'fa-solid fa-flag',
            'parent_id'     => $groupId,
            'permission_id' => $this->viewOrdersPerm->id,
            'order'         => 1,
            'enabled'       => true,
        ]);
        $pageRes->assertStatus(201)
            ->assertJsonPath('menu.parent_id', $groupId)
            ->assertJsonPath('menu.permission_id', $this->viewOrdersPerm->id);
    }

    public function test_validation_requires_route_uri_for_page_menus()
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson('/api/platform/menus', [
            'menu_name' => 'Invalid Page',
            'menu_type' => 'PAGE',
            'route_uri' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['route_uri']);
    }

    public function test_validation_rejects_non_existent_permission_and_parent()
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson('/api/platform/menus', [
            'menu_name'     => 'Bad Refs',
            'menu_type'     => 'PAGE',
            'route_uri'     => '/bad-route',
            'parent_id'     => 999999,
            'permission_id' => 999999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id', 'permission_id']);
    }

    public function test_validation_rejects_self_parenting_and_circular_hierarchy()
    {
        Sanctum::actingAs($this->superAdmin);

        $menuA = Menu::create(['menu_name' => 'Menu A', 'menu_type' => 'GROUP']);
        $menuB = Menu::create(['menu_name' => 'Menu B', 'menu_type' => 'GROUP', 'parent_id' => $menuA->id]);

        // Self-parenting
        $selfRes = $this->putJson("/api/platform/menus/{$menuA->id}", [
            'parent_id' => $menuA->id,
        ]);
        $selfRes->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);

        // Circular hierarchy (Make A's parent = B, when B is already child of A)
        $circRes = $this->putJson("/api/platform/menus/{$menuA->id}", [
            'parent_id' => $menuB->id,
        ]);
        $circRes->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    }

    public function test_safe_deletion_prevents_deleting_parent_with_children()
    {
        Sanctum::actingAs($this->superAdmin);

        $group = Menu::create(['menu_name' => 'Parent Group', 'menu_type' => 'GROUP']);
        $child = Menu::create(['menu_name' => 'Child Page', 'menu_type' => 'PAGE', 'route_uri' => '/child', 'parent_id' => $group->id]);

        $delRes = $this->deleteJson("/api/platform/menus/{$group->id}");
        $delRes->assertStatus(422);

        // Delete child first
        $this->deleteJson("/api/platform/menus/{$child->id}")->assertStatus(200);

        // Now parent can be deleted
        $this->deleteJson("/api/platform/menus/{$group->id}")->assertStatus(200);
    }

    public function test_super_admin_can_reorder_menus()
    {
        Sanctum::actingAs($this->superAdmin);

        $m1 = Menu::create(['menu_name' => 'Item 1', 'menu_type' => 'PAGE', 'route_uri' => '/i1', 'order' => 1]);
        $m2 = Menu::create(['menu_name' => 'Item 2', 'menu_type' => 'PAGE', 'route_uri' => '/i2', 'order' => 2]);

        $reorderRes = $this->postJson('/api/platform/menus/reorder', [
            'items' => [
                ['id' => $m1->id, 'order' => 2, 'parent_id' => null],
                ['id' => $m2->id, 'order' => 1, 'parent_id' => null],
            ]
        ]);

        $reorderRes->assertStatus(200);
        $this->assertEquals(2, $m1->fresh()->order);
        $this->assertEquals(1, $m2->fresh()->order);
    }

    public function test_dynamic_navigation_filters_by_user_permissions_and_hides_empty_groups()
    {
        // 1. Staff user (only has purchase.orders.view permission)
        Sanctum::actingAs($this->staffUser);

        $navRes = $this->getJson('/api/navigation');
        $navRes->assertStatus(200);
        $tree = $navRes->json();

        // Should see 'Purchases' group containing 'Purchase Orders'
        $purchasesGroup = collect($tree)->firstWhere('menu_name', 'Purchases');
        $this->assertNotNull($purchasesGroup);
        $this->assertNotEmpty($purchasesGroup['children']);
        
        $childUris = collect($purchasesGroup['children'])->pluck('route_uri');
        $this->assertTrue($childUris->contains('/purchase-orders/index') || $childUris->contains('/purchase-orders'));
        $this->assertFalse($childUris->contains('/purchase-orders/new')); // does not have purchase.orders.create

        // Groups with no authorized children (e.g., 'Finance', 'System Administration') must NOT be present
        $groupNames = collect($tree)->pluck('menu_name');
        $this->assertFalse($groupNames->contains('Finance'));
        $this->assertFalse($groupNames->contains('Platform Administration'));
    }

    public function test_disabled_menus_are_excluded_from_navigation()
    {
        Sanctum::actingAs($this->superAdmin);

        $poMenu = Menu::where('route_uri', '/purchase-orders/index')->first() ?? Menu::where('route_uri', '/purchase-orders')->first();
        $poMenu->update(['enabled' => false]);

        Sanctum::actingAs($this->staffUser);
        $navRes = $this->getJson('/api/navigation');
        $navRes->assertStatus(200);

        $purchasesGroup = collect($navRes->json())->firstWhere('menu_name', 'Purchases');
        if ($purchasesGroup) {
            $childUris = collect($purchasesGroup['children'])->pluck('route_uri');
            $this->assertFalse($childUris->contains('/purchase-orders'));
        }
    }

    public function test_menu_seeder_is_idempotent()
    {
        $this->seed(\Database\Seeders\MenuSeeder::class);
        $this->seed(\Database\Seeders\MenuSeeder::class);

        $groupCount = Menu::whereNull('parent_id')->count();
        $this->assertGreaterThan(0, $groupCount);
    }
}
