<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAndRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Organization $orgB;
    protected User $adminA;
    protected User $adminB;
    protected Branch $branchA;
    protected Branch $branchB;
    protected Warehouse $warehouseA;
    protected Warehouse $warehouseB;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed default global permissions
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        // Org A
        $this->orgA = Organization::create(['name' => 'Org A', 'code' => 'ORGA', 'is_active' => true]);
        $this->branchA = Branch::create(['organization_id' => $this->orgA->id, 'name' => 'Branch A', 'code' => 'BRA']);
        $this->warehouseA = Warehouse::create(['organization_id' => $this->orgA->id, 'branch_id' => $this->branchA->id, 'name' => 'WH A', 'code' => 'WHA']);

        $roleAdminA = Role::create(['organization_id' => $this->orgA->id, 'name' => 'Administrator', 'slug' => 'administrator', 'is_system' => true]);
        $this->adminA = User::create(['organization_id' => $this->orgA->id, 'name' => 'Admin A', 'email' => 'admina@orga.com', 'password' => bcrypt('password')]);
        $this->adminA->roles()->attach($roleAdminA->id, ['organization_id' => $this->orgA->id]);

        // Org B
        $this->orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $this->branchB = Branch::create(['organization_id' => $this->orgB->id, 'name' => 'Branch B', 'code' => 'BRB']);
        $this->warehouseB = Warehouse::create(['organization_id' => $this->orgB->id, 'branch_id' => $this->branchB->id, 'name' => 'WH B', 'code' => 'WHB']);

        $roleAdminB = Role::create(['organization_id' => $this->orgB->id, 'name' => 'Administrator', 'slug' => 'administrator', 'is_system' => true]);
        $this->adminB = User::create(['organization_id' => $this->orgB->id, 'name' => 'Admin B', 'email' => 'adminb@orgb.com', 'password' => bcrypt('password')]);
        $this->adminB->roles()->attach($roleAdminB->id, ['organization_id' => $this->orgB->id]);
    }

    public function test_admin_can_list_organization_users()
    {
        Sanctum::actingAs($this->adminA);

        $response = $this->getJson('/api/users');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $this->assertEquals('Admin A', $response->json('0.name'));
        $this->assertEquals('Org A', $response->json('0.organization.name'));
    }

    public function test_admin_can_list_organization_roles()
    {
        Sanctum::actingAs($this->adminA);

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($response->json()));
        $roleNames = collect($response->json())->pluck('name');
        $this->assertTrue($roleNames->contains('Administrator'));
    }

    public function test_admin_can_create_custom_role_with_permissions()
    {
        Sanctum::actingAs($this->adminA);

        $permissions = Permission::where('enabled', true)->take(2)->pluck('id')->toArray();

        $response = $this->postJson('/api/roles', [
            'name' => 'Sales Rep',
            'permissions' => $permissions
        ]);

        $response->assertStatus(201);
        $this->assertEquals('Sales Rep', $response->json('name'));
        $this->assertEquals('sales-rep', $response->json('slug'));
        $this->assertFalse($response->json('is_system'));
        $this->assertCount(2, $response->json('permissions'));

        // Verify it was created in the DB
        $role = Role::where('organization_id', $this->orgA->id)->where('slug', 'sales-rep')->first();
        $this->assertNotNull($role);
        $this->assertCount(2, $role->permissions);
    }

    public function test_admin_cannot_create_role_with_duplicate_slug_in_organization()
    {
        Sanctum::actingAs($this->adminA);

        // Create first custom role
        $this->postJson('/api/roles', [
            'name' => 'Sales Rep'
        ])->assertStatus(201);

        // Attempt second custom role with same name
        $response = $this->postJson('/api/roles', [
            'name' => 'Sales Rep'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('name');
    }

    public function test_admin_can_update_custom_role()
    {
        Sanctum::actingAs($this->adminA);

        // Create a custom role
        $role = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Old Name',
            'slug' => 'old-name',
            'is_system' => false
        ]);

        $permissions = Permission::where('enabled', true)->take(2)->pluck('id')->toArray();

        $response = $this->putJson("/api/roles/{$role->id}", [
            'name' => 'New Name',
            'permissions' => $permissions
        ]);

        $response->assertStatus(200);
        $this->assertEquals('New Name', $response->json('name'));
        $this->assertEquals('new-name', $response->json('slug'));
        $this->assertCount(2, $response->json('permissions'));
    }

    public function test_admin_cannot_update_system_role()
    {
        Sanctum::actingAs($this->adminA);

        $systemRole = Role::where('organization_id', $this->orgA->id)->where('slug', 'administrator')->first();

        $response = $this->putJson("/api/roles/{$systemRole->id}", [
            'name' => 'Attempted System Rename'
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_delete_system_role()
    {
        Sanctum::actingAs($this->adminA);

        $systemRole = Role::where('organization_id', $this->orgA->id)->where('slug', 'administrator')->first();

        $response = $this->deleteJson("/api/roles/{$systemRole->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_unused_custom_role()
    {
        Sanctum::actingAs($this->adminA);

        $role = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Temporary Role',
            'slug' => 'temporary-role',
            'is_system' => false
        ]);

        $response = $this->deleteJson("/api/roles/{$role->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('roles', ['id' => $role->id]);
    }

    public function test_admin_cannot_delete_role_assigned_to_users()
    {
        Sanctum::actingAs($this->adminA);

        $role = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Assigned Role',
            'slug' => 'assigned-role',
            'is_system' => false
        ]);

        // Assign role to Admin A
        $this->adminA->roles()->attach($role->id, ['organization_id' => $this->orgA->id]);

        $response = $this->deleteJson("/api/roles/{$role->id}");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Cannot delete role because it is currently assigned to one or more staff members.');
    }

    public function test_admin_can_create_staff_member()
    {
        Sanctum::actingAs($this->adminA);

        $roleId = Role::where('organization_id', $this->orgA->id)->first()->id;

        $response = $this->postJson('/api/users', [
            'name' => 'Staff One',
            'email' => 'staff1@orga.com',
            'password' => 'password123',
            'role_id' => $roleId,
            'branch_id' => $this->branchA->id,
            'warehouse_id' => $this->warehouseA->id
        ]);

        $response->assertStatus(201);
        $this->assertEquals('Staff One', $response->json('user.name'));
        $this->assertEquals('staff1@orga.com', $response->json('user.email'));

        // Verify scopes created
        $staffUser = User::where('email', 'staff1@orga.com')->first();
        $this->assertNotNull($staffUser);
        $this->assertEquals($this->orgA->id, $staffUser->organization_id);
        $this->assertCount(1, $staffUser->scopes);
        $this->assertEquals($this->branchA->id, $staffUser->scopes->first()->branch_id);
        $this->assertEquals($this->warehouseA->id, $staffUser->scopes->first()->warehouse_id);
    }

    public function test_admin_cannot_create_staff_with_cross_tenant_inputs()
    {
        Sanctum::actingAs($this->adminA);

        // Role from Org B
        $roleIdB = Role::withoutGlobalScopes()->where('organization_id', $this->orgB->id)->first()->id;

        $response = $this->postJson('/api/users', [
            'name' => 'Staff Two',
            'email' => 'staff2@orga.com',
            'password' => 'password123',
            'role_id' => $roleIdB,
            'branch_id' => $this->branchA->id,
            'warehouse_id' => $this->warehouseA->id
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_id');

        // Branch from Org B
        $response = $this->postJson('/api/users', [
            'name' => 'Staff Two',
            'email' => 'staff2@orga.com',
            'password' => 'password123',
            'role_id' => Role::where('organization_id', $this->orgA->id)->first()->id,
            'branch_id' => $this->branchB->id,
            'warehouse_id' => $this->warehouseA->id
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('branch_id');
    }

    public function test_admin_can_update_staff_member()
    {
        Sanctum::actingAs($this->adminA);

        $staff = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Initial Name',
            'email' => 'staff_update@orga.com',
            'password' => bcrypt('password')
        ]);

        $newBranch = Branch::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Branch Two',
            'code' => 'BR2'
        ]);

        $newWarehouse = Warehouse::create([
            'organization_id' => $this->orgA->id,
            'branch_id' => $newBranch->id,
            'name' => 'Warehouse Two',
            'code' => 'WH2'
        ]);

        $newRole = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Sales Lead',
            'slug' => 'sales-lead',
            'is_system' => false
        ]);

        $response = $this->putJson("/api/users/{$staff->id}", [
            'name' => 'Updated Name',
            'role_id' => $newRole->id,
            'branch_id' => $newBranch->id,
            'warehouse_id' => $newWarehouse->id,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.name', 'Updated Name');

        $staff->refresh();
        $this->assertEquals('Updated Name', $staff->name);
        $this->assertTrue($staff->roles->contains($newRole->id));
    }

    public function test_admin_cannot_update_staff_member_with_cross_tenant_inputs()
    {
        Sanctum::actingAs($this->adminA);

        $staff = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Staff A',
            'email' => 'staff_cross@orga.com',
            'password' => bcrypt('password')
        ]);

        $roleIdB = Role::withoutGlobalScopes()->where('organization_id', $this->orgB->id)->first()->id;

        $response = $this->putJson("/api/users/{$staff->id}", [
            'role_id' => $roleIdB
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_id');

        $response = $this->putJson("/api/users/{$staff->id}", [
            'branch_id' => $this->branchB->id
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('branch_id');
    }

    public function test_admin_cannot_delete_self()
    {
        Sanctum::actingAs($this->adminA);

        $response = $this->deleteJson("/api/users/{$this->adminA->id}");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'You cannot delete yourself.');
    }

    public function test_admin_cannot_delete_sole_organization_owner()
    {
        Sanctum::actingAs($this->adminA);

        $staffRole = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'HR Manager',
            'slug' => 'hr-manager',
            'is_system' => false
        ]);
        $manageUsersPermission = Permission::where('slug', 'master.users.manage')->first();
        if ($manageUsersPermission) {
            $staffRole->permissions()->attach($manageUsersPermission->id, ['organization_id' => $this->orgA->id]);
        }

        $anotherUser = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Second User',
            'email' => 'user2@orga.com',
            'password' => bcrypt('password')
        ]);
        $anotherUser->roles()->attach($staffRole->id, ['organization_id' => $this->orgA->id]);

        Sanctum::actingAs($anotherUser);

        $response = $this->deleteJson("/api/users/{$this->adminA->id}");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Cannot delete the organization owner account.');
    }
}
