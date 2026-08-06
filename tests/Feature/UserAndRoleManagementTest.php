<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use App\Domains\Security\Services\OrganizationRegistrationService;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAndRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected User $adminA;
    protected Branch $branchA;
    protected Warehouse $warehouseA;

    protected Organization $orgB;
    protected User $adminB;
    protected Branch $branchB;
    protected Warehouse $warehouseB;

    protected function setUp(): void
    {
        parent::setUp();

        $registrationService = app(OrganizationRegistrationService::class);

        // Provision Org A
        $resultA = $registrationService->register([
            'name' => 'Org A',
            'code' => 'ORGA'
        ], [
            'name' => 'Admin A',
            'email' => 'admin@orga.com',
            'password' => 'password123'
        ]);

        $this->orgA = $resultA['organization'];
        $this->adminA = $resultA['user'];
        $this->branchA = $resultA['branch'];
        $this->warehouseA = $resultA['warehouse'];

        // Provision Org B
        $resultB = $registrationService->register([
            'name' => 'Org B',
            'code' => 'ORGB'
        ], [
            'name' => 'Admin B',
            'email' => 'admin@orgb.com',
            'password' => 'password123'
        ]);

        $this->orgB = $resultB['organization'];
        $this->adminB = $resultB['user'];
        $this->branchB = $resultB['branch'];
        $this->warehouseB = $resultB['warehouse'];
    }

    public function test_admin_can_list_permissions()
    {
        Sanctum::actingAs($this->adminA);

        $response = $this->getJson('/api/permissions');

        $response->assertStatus(200);

        // All returned permissions should belong to Org A
        foreach ($response->json() as $perm) {
            $this->assertEquals($this->orgA->id, $perm['organization_id']);
        }
    }

    public function test_admin_can_list_roles()
    {
        Sanctum::actingAs($this->adminA);

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200);

        // Check that the system role "Administrator" is present
        $response->assertJsonFragment([
            'slug' => 'administrator',
            'is_system' => true
        ]);
    }

    public function test_admin_can_create_custom_role_with_permissions()
    {
        Sanctum::actingAs($this->adminA);

        // Fetch two permissions belonging to Org A
        $permissions = Permission::where('organization_id', $this->orgA->id)->take(2)->pluck('id')->toArray();

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

    public function test_admin_cannot_assign_permission_from_other_organization_to_role()
    {
        Sanctum::actingAs($this->adminA);

        // Fetch a permission belonging to Org B
        $invalidPermissionId = Permission::withoutGlobalScopes()->where('organization_id', $this->orgB->id)->first()->id;

        $response = $this->postJson('/api/roles', [
            'name' => 'Invalid Role',
            'permissions' => [$invalidPermissionId]
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('permissions.0');
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

        $permissions = Permission::where('organization_id', $this->orgA->id)->take(2)->pluck('id')->toArray();

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

        // Find the system Administrator role for Org A
        $adminRole = Role::where('organization_id', $this->orgA->id)->where('slug', 'administrator')->first();

        $response = $this->putJson("/api/roles/{$adminRole->id}", [
            'name' => 'Modified Admin'
        ]);

        $response->assertStatus(403);
        $this->assertEquals('System roles cannot be modified.', $response->json('message'));
    }

    public function test_admin_can_delete_custom_role()
    {
        Sanctum::actingAs($this->adminA);

        // Create custom role
        $role = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Custom Role',
            'slug' => 'custom-role',
            'is_system' => false
        ]);

        $response = $this->deleteJson("/api/roles/{$role->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('roles', ['id' => $role->id]);
    }

    public function test_admin_cannot_delete_system_role()
    {
        Sanctum::actingAs($this->adminA);

        // Find system role
        $adminRole = Role::where('organization_id', $this->orgA->id)->where('slug', 'administrator')->first();

        $response = $this->deleteJson("/api/roles/{$adminRole->id}");

        $response->assertStatus(403);
        $this->assertEquals('System roles cannot be deleted.', $response->json('message'));
    }

    public function test_admin_cannot_delete_role_assigned_to_user()
    {
        Sanctum::actingAs($this->adminA);

        // Create custom role
        $role = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Assigned Role',
            'slug' => 'assigned-role',
            'is_system' => false
        ]);

        // Create user and assign role
        $staff = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Staff Member',
            'email' => 'staff@orga.com',
            'password' => bcrypt('password')
        ]);
        $staff->roles()->attach($role->id, ['organization_id' => $this->orgA->id]);

        $response = $this->deleteJson("/api/roles/{$role->id}");

        $response->assertStatus(400);
        $this->assertEquals('Cannot delete role because it is currently assigned to one or more staff members.', $response->json('message'));
    }

    public function test_admin_can_create_staff_with_valid_scoped_inputs()
    {
        Sanctum::actingAs($this->adminA);

        // Fetch valid role for Org A
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
        $response->assertJsonStructure(['message', 'user']);
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

    public function test_admin_can_invite_staff_with_valid_scoped_inputs()
    {
        Sanctum::actingAs($this->adminA);

        $roleId = Role::where('organization_id', $this->orgA->id)->first()->id;

        $response = $this->postJson('/api/users/invite', [
            'name' => 'Invited Staff',
            'email' => 'invited@orga.com',
            'role_id' => $roleId,
            'branch_id' => $this->branchA->id,
            'warehouse_id' => $this->warehouseA->id
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['message', 'invitation_link', 'invitation_token', 'user']);
    }

    public function test_admin_cannot_invite_staff_with_cross_tenant_inputs()
    {
        Sanctum::actingAs($this->adminA);

        $roleIdB = Role::withoutGlobalScopes()->where('organization_id', $this->orgB->id)->first()->id;

        $response = $this->postJson('/api/users/invite', [
            'name' => 'Invited Staff',
            'email' => 'invited@orga.com',
            'role_id' => $roleIdB,
            'branch_id' => $this->branchA->id,
            'warehouse_id' => $this->warehouseA->id
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_id');
    }

    public function test_admin_can_update_staff_member()
    {
        Sanctum::actingAs($this->adminA);

        // Create a staff user first
        $staff = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Initial Name',
            'email' => 'staff_update@orga.com',
            'password' => bcrypt('password')
        ]);
        
        // Retrieve custom roles and another branch/warehouse for update
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
        
        // Assert changes in DB
        $staff->refresh();
        $this->assertEquals('Updated Name', $staff->name);
        $this->assertTrue($staff->roles->contains($newRole->id));
        
        $scope = $staff->scopes()->first();
        $this->assertNotNull($scope);
        $this->assertEquals($newBranch->id, $scope->branch_id);
        $this->assertEquals($newWarehouse->id, $scope->warehouse_id);
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

        // Try updating role with Org B role
        $roleIdB = Role::withoutGlobalScopes()->where('organization_id', $this->orgB->id)->first()->id;

        $response = $this->putJson("/api/users/{$staff->id}", [
            'role_id' => $roleIdB
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_id');

        // Try updating branch with Org B branch
        $response = $this->putJson("/api/users/{$staff->id}", [
            'branch_id' => $this->branchB->id
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('branch_id');

        // Try updating warehouse with Org B warehouse
        $response = $this->putJson("/api/users/{$staff->id}", [
            'warehouse_id' => $this->warehouseB->id
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('warehouse_id');
    }
}
