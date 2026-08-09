<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchCRUDTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create(['name' => 'Org A', 'code' => 'ORGA', 'is_active' => true]);
        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Admin Operator',
            'email' => 'admin@orga.com',
            'password' => bcrypt('password'),
        ]);
    }

    public function test_branch_creation_validation()
    {
        $payload = [
            'name' => 'Gujarat Branch',
            'code' => 'BR-GUJ',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/branches-crud', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('branches', [
            'organization_id' => $this->org->id,
            'code' => 'BR-GUJ',
            'name' => 'Gujarat Branch',
        ]);

        // Duplicate code in same organization should fail
        $responseDuplicate = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/branches-crud', $payload);

        $responseDuplicate->assertStatus(422);
    }

    public function test_branch_update()
    {
        $branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Old Branch Name',
            'code' => 'BR-OLD',
        ]);

        $payload = [
            'name' => 'New Branch Name',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/branches-crud/{$branch->id}", $payload);

        $response->assertStatus(200);
        $this->assertEquals('New Branch Name', $branch->fresh()->name);
    }

    public function test_branch_deletion_checks()
    {
        $branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Delete Branch',
            'code' => 'BR-DEL',
        ]);

        // 1. Success delete if no dependencies
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/branches-crud/{$branch->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('branches', ['id' => $branch->id]);

        // Recreate
        $branch2 = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Delete Branch 2',
            'code' => 'BR-DEL2',
        ]);

        // 2. Add Warehouse -> delete should fail
        Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch2->id,
            'name' => 'Warehouse linked',
            'code' => 'WH-LINK',
            'type' => 'MAIN',
        ]);

        $responseFail = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/branches-crud/{$branch2->id}");

        $responseFail->assertStatus(422);
        $responseFail->assertJsonFragment(['message' => 'Cannot delete branch because it contains active warehouses.']);
    }

    public function test_branch_tenant_isolation()
    {
        // Organization B
        $orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'Operator B',
            'email' => 'operator@orgb.com',
            'password' => bcrypt('password'),
        ]);

        $branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Org A Branch',
            'code' => 'BR-A',
        ]);

        // User B tries to view
        $response = $this->actingAs($userB, 'sanctum')
            ->getJson("/api/branches-crud/{$branch->id}");

        $response->assertStatus(404);
    }
}
