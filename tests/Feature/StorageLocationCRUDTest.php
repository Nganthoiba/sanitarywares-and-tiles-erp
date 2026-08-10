<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorageLocationCRUDTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $warehouse;

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
            'name' => 'Gujarat Branch',
            'code' => 'BR-GUJ',
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Main Morbi Warehouse',
            'code' => 'WH-MORBI',
            'type' => 'MAIN',
        ]);
    }

    public function test_storage_location_creation_validation()
    {
        $payload = [
            'warehouse_id' => $this->warehouse->id,
            'name' => 'Rack A',
            'location_type' => 'RACK',
            'code' => 'RACK-A',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/storage-locations-crud', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('storage_locations', [
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'code' => 'RACK-A',
            'name' => 'Rack A',
        ]);

        // Duplicate code in same organization and warehouse should fail
        $responseDuplicate = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/storage-locations-crud', $payload);

        $responseDuplicate->assertStatus(422);
    }

    public function test_storage_location_update()
    {
        $location = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'name' => 'Old Rack Name',
            'location_type' => 'RACK',
            'code' => 'RACK-OLD',
        ]);

        $payload = [
            'name' => 'New Rack Name',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/storage-locations-crud/{$location->id}", $payload);

        $response->assertStatus(200);
        $this->assertEquals('New Rack Name', $location->fresh()->name);
    }

    public function test_storage_location_deletion()
    {
        $location = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'name' => 'Rack to Delete',
            'location_type' => 'RACK',
            'code' => 'RACK-DEL',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/storage-locations-crud/{$location->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('storage_locations', ['id' => $location->id]);
    }

    public function test_storage_location_tenant_isolation()
    {
        $orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'Operator B',
            'email' => 'operator@orgb.com',
            'password' => bcrypt('password'),
        ]);

        $location = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'name' => 'Org A Location',
            'location_type' => 'RACK',
            'code' => 'LOC-A',
        ]);

        // User B tries to view Org A's location
        $response = $this->actingAs($userB, 'sanctum')
            ->getJson("/api/storage-locations-crud/{$location->id}");

        $response->assertStatus(404);
    }
}
