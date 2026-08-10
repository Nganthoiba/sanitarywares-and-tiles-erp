<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Supplier;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierCRUDTest extends TestCase
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

    public function test_supplier_creation_validation()
    {
        $payload = [
            'name' => 'Kajaria Supplier',
            'code' => 'SPL-KAJARIA',
            'email' => 'kajaria@supplier.com',
            'phone' => '+919999999999',
            'gstin' => '24AAAFF1234A1Z1',
            'address' => 'Morbi, Gujarat',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/suppliers-crud', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('suppliers', [
            'organization_id' => $this->org->id,
            'code' => 'SPL-KAJARIA',
            'name' => 'Kajaria Supplier',
        ]);

        // Duplicate code in same organization should fail
        $responseDuplicate = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/suppliers-crud', $payload);

        $responseDuplicate->assertStatus(422);
    }

    public function test_supplier_update()
    {
        $supplier = Supplier::create([
            'organization_id' => $this->org->id,
            'name' => 'Old Supplier Name',
            'code' => 'SPL-OLD',
        ]);

        $payload = [
            'name' => 'New Supplier Name',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/suppliers-crud/{$supplier->id}", $payload);

        $response->assertStatus(200);
        $this->assertEquals('New Supplier Name', $supplier->fresh()->name);
    }

    public function test_supplier_deletion_checks()
    {
        $supplier = Supplier::create([
            'organization_id' => $this->org->id,
            'name' => 'Delete Supplier',
            'code' => 'SPL-DEL',
        ]);

        // Success delete if no dependencies
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/suppliers-crud/{$supplier->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);
    }

    public function test_supplier_tenant_isolation()
    {
        $orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'Operator B',
            'email' => 'operator@orgb.com',
            'password' => bcrypt('password'),
        ]);

        $supplier = Supplier::create([
            'organization_id' => $this->org->id,
            'name' => 'Org A Supplier',
            'code' => 'SPL-A',
        ]);

        // User B tries to view Org A's supplier
        $response = $this->actingAs($userB, 'sanctum')
            ->getJson("/api/suppliers-crud/{$supplier->id}");

        $response->assertStatus(404);
    }
}
