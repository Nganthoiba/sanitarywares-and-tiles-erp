<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Inventory\Models\InventoryObject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseCRUDTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Branch $branch;

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

        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Morbi Branch',
            'code' => 'BR-MRB',
            'is_active' => true,
        ]);
    }

    public function test_warehouse_creation_validation()
    {
        $payload = [
            'branch_id' => $this->branch->id,
            'name' => 'Main Ceramic Store',
            'code' => 'WH-CER1',
            'type' => 'TILE_STORE',
            'address' => 'Morbi Highway, India',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/warehouses-crud', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('warehouses', [
            'organization_id' => $this->org->id,
            'code' => 'WH-CER1',
            'name' => 'Main Ceramic Store',
        ]);

        // Duplicate code in same organization should fail
        $responseDuplicate = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/warehouses-crud', $payload);

        $responseDuplicate->assertStatus(422);
    }

    public function test_warehouse_update()
    {
        $wh = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Old Name',
            'code' => 'WH-OLD',
            'type' => 'MAIN',
        ]);

        $payload = [
            'name' => 'New Name',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/warehouses-crud/{$wh->id}", $payload);

        $response->assertStatus(200);
        $this->assertEquals('New Name', $wh->fresh()->name);
    }

    public function test_warehouse_deletion_checks()
    {
        $wh = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Delete Store',
            'code' => 'WH-DEL',
            'type' => 'MAIN',
        ]);

        // 1. Success delete if no dependencies
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/warehouses-crud/{$wh->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('warehouses', ['id' => $wh->id]);

        // Recreate
        $wh2 = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Delete Store 2',
            'code' => 'WH-DEL2',
            'type' => 'MAIN',
        ]);

        // 2. Add storage location -> delete should fail
        StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $wh2->id,
            'name' => 'Zone 1',
            'code' => 'Z1',
            'location_type' => 'ZONE',
        ]);

        $responseFail = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/warehouses-crud/{$wh2->id}");

        $responseFail->assertStatus(422);
        $responseFail->assertJsonFragment(['message' => 'Cannot delete warehouse because it has storage locations assigned.']);
    }

    public function test_warehouse_tenant_isolation()
    {
        // Organization B
        $orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'Operator B',
            'email' => 'operator@orgb.com',
            'password' => bcrypt('password'),
        ]);

        $wh = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Org A Warehouse',
            'code' => 'WH-A',
            'type' => 'MAIN',
        ]);

        // User B tries to view
        $response = $this->actingAs($userB, 'sanctum')
            ->getJson("/api/warehouses-crud/{$wh->id}");

        $response->assertStatus(404);
    }
}
