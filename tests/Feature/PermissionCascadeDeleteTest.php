<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use App\Domains\Security\Models\PermissionGroup;
use App\Domains\Security\Models\RolePermission;
use App\Domains\Security\Models\Menu;
use Laravel\Sanctum\Sanctum;

class PermissionCascadeDeleteTest extends TestCase
{
    protected PermissionGroup $group;
    protected Permission $permission;
    protected Role $role;
    protected Menu $menu;
    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        // Create group
        $this->group = PermissionGroup::create([
            'name' => 'Test Group ' . uniqid(),
            'enabled' => true,
        ]);

        // Create permission
        $this->permission = Permission::create([
            'permission_group_id' => $this->group->id,
            'slug' => 'test.cascade.permission_' . uniqid(),
            'display_name' => 'Test Cascade Permission',
            'description' => 'Permission for cascade delete testing',
            'enabled' => true,
        ]);

        // Create role and assign permission
        $this->role = Role::create([
            'name' => 'Test Role ' . uniqid(),
            'slug' => 'test_role_' . uniqid(),
            'description' => 'Role for testing',
            'is_system' => false,
        ]);

        RolePermission::create([
            'organization_id' => null,
            'role_id' => $this->role->id,
            'permission_id' => $this->permission->id,
        ]);

        // Create menu linking to permission
        $this->menu = Menu::create([
            'menu_name' => 'Test Menu ' . uniqid(),
            'menu_type' => 'PAGE',
            'route_uri' => '/test-route-' . uniqid(),
            'permission_id' => $this->permission->id,
            'order' => 10,
            'enabled' => true,
        ]);

        // Create superadmin role and user for API requests
        $superAdminRole = Role::firstOrCreate([
            'slug' => 'super-admin'
        ], [
            'organization_id' => null,
            'name' => 'Super Administrator',
            'is_system' => true
        ]);

        $this->superAdmin = User::create([
            'organization_id' => null,
            'name' => 'Super Admin',
            'email' => 'superadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->superAdmin->roles()->attach($superAdminRole->id, ['organization_id' => null]);
    }

    public function test_deleting_permission_cascades_role_permissions_and_sets_menu_permission_id_to_null()
    {
        $permId = $this->permission->id;
        $menuId = $this->menu->id;

        // Verify initial state
        $this->assertEquals(1, RolePermission::where('permission_id', $permId)->count());
        $this->assertEquals($permId, Menu::find($menuId)->permission_id);

        // Soft delete permission
        $this->permission->delete();

        // Verify role permissions mapped to this permission are deleted
        $this->assertEquals(0, RolePermission::where('permission_id', $permId)->count());

        // Verify menu permission_id is set to null
        $updatedMenu = Menu::find($menuId);
        $this->assertNotNull($updatedMenu);
        $this->assertNull($updatedMenu->permission_id);
    }

    public function test_api_destroy_permission_executes_cascade_deletion_and_menu_disassociation()
    {
        Sanctum::actingAs($this->superAdmin);

        $permId = $this->permission->id;
        $menuId = $this->menu->id;

        $response = $this->deleteJson("/api/platform/permissions/{$permId}");

        $response->assertStatus(200)
            ->assertJsonPath('message', "Permission '{$this->permission->slug}' deleted successfully.");

        // Assert role_permissions deleted
        $this->assertEquals(0, RolePermission::where('permission_id', $permId)->count());

        // Assert menu permission_id set to null
        $updatedMenu = Menu::find($menuId);
        $this->assertNull($updatedMenu->permission_id);
    }

    public function test_api_returns_error_message_when_permission_operation_fails()
    {
        Sanctum::actingAs($this->superAdmin);

        // Delete non-existent permission
        $delResponse = $this->deleteJson('/api/platform/permissions/9999999');
        $delResponse->assertStatus(404)
            ->assertJsonPath('message', 'Permission not found.');

        // Update non-existent permission
        $updateResponse = $this->putJson('/api/platform/permissions/9999999', [
            'display_name' => 'Non Existent'
        ]);
        $updateResponse->assertStatus(404)
            ->assertJsonPath('message', 'Permission not found.');

        // Toggle non-existent permission
        $toggleResponse = $this->postJson('/api/platform/permissions/9999999/toggle');
        $toggleResponse->assertStatus(404)
            ->assertJsonPath('message', 'Permission not found.');
    }
}
