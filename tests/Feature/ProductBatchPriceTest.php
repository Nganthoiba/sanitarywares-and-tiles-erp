<?php

namespace Tests\Feature;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\Supplier;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductBatchPrice;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Security\Models\Permission;
use App\Domains\Security\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBatchPriceTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Warehouse $warehouse;
    protected StorageLocation $location;
    protected Supplier $supplier;
    protected Unit $unit;
    protected Product $variant;
    protected User $admin;
    protected User $staffWithoutPerm;
    protected User $staffWithPerm;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        // 1. Create Organization
        $this->org = Organization::create([
            'name' => 'Test Tile & Sanitary Org',
            'code' => 'TTSO',
            'is_active' => true,
        ]);

        // 2. Create Master Records
        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Warehouse',
            'code' => 'WH01',
            'is_active' => true,
        ]);

        $this->location = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'name' => 'Floor A',
            'code' => 'LOC-A',
        ]);

        $this->supplier = Supplier::create([
            'organization_id' => $this->org->id,
            'name' => 'Ceramics Global Supplier',
            'code' => 'SUP01',
            'is_active' => true,
        ]);

        $this->unit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Box',
            'code' => 'BOX',
            'is_active' => true,
        ]);

        $taxProfile = TaxProfile::create([
            'name' => 'Standard GST',
            'code' => 'GST18',
            'tax_rate' => 18.00,
            'is_active' => true,
        ]);

        $this->variant = Product::create([
            'organization_id' => $this->org->id,
            'name' => 'Vitrified Marble Tile 60x60',
            'sku' => 'TILE-6060-WM',
            'inventory_behavior' => 'BULK',
            'base_unit_id' => $this->unit->id,
            'tax_profile_id' => $taxProfile->id,
            'is_active' => true,
        ]);

        // 3. Setup Users & Roles
        $adminRole = Role::create([
            'organization_id' => $this->org->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
        ]);

        $staffRole = Role::create([
            'organization_id' => $this->org->id,
            'name' => 'Inventory Staff',
            'slug' => 'inventory-staff',
        ]);

        $staffWithPermRole = Role::create([
            'organization_id' => $this->org->id,
            'name' => 'Pricing Manager',
            'slug' => 'pricing-manager',
        ]);

        $pricePerm = Permission::where('slug', 'products.batch_prices.update')->first();
        if ($pricePerm) {
            $staffWithPermRole->permissions()->attach($pricePerm->id, ['organization_id' => $this->org->id]);
        }

        $this->admin = User::factory()->create([
            'organization_id' => $this->org->id,
            'email' => 'admin@ttso.com',
        ]);
        $this->admin->roles()->attach($adminRole->id, ['organization_id' => $this->org->id]);

        $this->staffWithoutPerm = User::factory()->create([
            'organization_id' => $this->org->id,
            'email' => 'staff1@ttso.com',
        ]);
        $this->staffWithoutPerm->roles()->attach($staffRole->id, ['organization_id' => $this->org->id]);

        $this->staffWithPerm = User::factory()->create([
            'organization_id' => $this->org->id,
            'email' => 'pricing@ttso.com',
        ]);
        $this->staffWithPerm->roles()->attach($staffWithPermRole->id, ['organization_id' => $this->org->id]);
    }

    public function test_grn_creation_auto_populates_batch_prices_with_null_prices()
    {
        $payload = [
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'supplier_id' => $this->supplier->id,
            'batch_number' => 'BATCH-2026-X100',
            'received_date' => '2026-08-27',
            'remarks' => 'Testing batch price auto creation',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'unit_id' => $this->unit->id,
                    'quantity_received' => 10,
                    'quantity_accepted' => 10,
                ]
            ]
        ];

        $response = $this->actingAs($this->staffWithoutPerm, 'sanctum')
            ->postJson('/api/grn', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('product_batch_prices', [
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->variant->id,
            'batch_number' => 'BATCH-2026-X100',
            'user_id' => $this->staffWithoutPerm->id,
            'cost_price' => null,
            'sale_price' => null,
        ]);
    }

    public function test_unauthorized_user_cannot_update_batch_prices()
    {
        $batchPrice = ProductBatchPrice::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->variant->id,
            'batch_number' => 'BATCH-2026-TEST1',
            'user_id' => $this->staffWithoutPerm->id,
            'cost_price' => null,
            'sale_price' => null,
        ]);

        $response = $this->actingAs($this->staffWithoutPerm, 'sanctum')
            ->putJson("/api/product-batch-prices/{$batchPrice->id}", [
                'cost_price' => 250.00,
                'sale_price' => 450.00,
            ]);

        $response->assertStatus(403);
    }

    public function test_authorized_user_and_admin_can_update_batch_prices()
    {
        $batchPrice = ProductBatchPrice::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->variant->id,
            'batch_number' => 'BATCH-2026-TEST2',
            'user_id' => $this->admin->id,
            'cost_price' => null,
            'sale_price' => null,
        ]);

        // 1. Staff with permission updates price
        $response = $this->actingAs($this->staffWithPerm, 'sanctum')
            ->putJson("/api/product-batch-prices/{$batchPrice->id}", [
                'cost_price' => 300.00,
                'sale_price' => 500.00,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('product_batch_prices', [
            'id' => $batchPrice->id,
            'cost_price' => '300.0000',
            'sale_price' => '500.0000',
            'updated_by' => $this->staffWithPerm->id,
        ]);

        // 2. Tenant Admin updates price
        $response2 = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/product-batch-prices/{$batchPrice->id}", [
                'cost_price' => 320.00,
                'sale_price' => 550.00,
            ]);

        $response2->assertStatus(200);
        $this->assertDatabaseHas('product_batch_prices', [
            'id' => $batchPrice->id,
            'cost_price' => '320.0000',
            'sale_price' => '550.0000',
            'updated_by' => $this->admin->id,
        ]);
    }
}
