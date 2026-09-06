<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Customer;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Services\ReservationService;
use Laravel\Sanctum\Sanctum;

class InventoryReservationAndLowStockTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected User $user;
    protected Warehouse $warehouse;
    protected Product $product;
    protected Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create(['name' => 'Test Tile & Sanitary Org', 'code' => 'TEST-ORG-1', 'slug' => 'test-tile-org']);
        $this->user = User::factory()->create(['organization_id' => $this->org->id]);

        $branch = \App\Domains\Master\Models\Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Branch',
            'code' => 'BR-MAIN',
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse',
            'code' => 'WH-MAIN',
            'is_active' => true,
        ]);

        $category = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles',
        ]);

        $this->unit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Box',
            'symbol' => 'Box',
            'type' => 'QUANTITY',
        ]);

        $tax = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'igst_rate' => 18,
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $category->id,
            'purchase_unit_id' => $this->unit->id,
            'sales_unit_id' => $this->unit->id,
            'base_unit_id' => $this->unit->id,
            'name' => 'Kajaria 600×600 Tile',
            'sku' => 'KAJ-600-ROYAL',
            'inventory_behavior' => 'STANDARD',
            'pieces_per_box' => 4,
            'low_stock_warning_level' => 20.0000,
            'tax_profile_id' => $tax->id,
        ]);

        // Add 120 Box physical On Hand stock
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'OBJ-KAJ-1',
            'quantity' => 120.0000,
            'status' => 'ON_HAND',
        ]);
    }

    public function test_can_reserve_stock_and_available_stock_is_calculated_correctly()
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/inventory/reserve', [
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 30,
            'remarks' => 'Order #101 Reservation',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('inventory_reservations', [
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 30.0000,
            'status' => 'ACTIVE',
        ]);

        // Verify Inventory API returns On Hand: 120, Reserved: 30, Available: 90
        $indexResponse = $this->getJson('/api/inventory');
        $indexResponse->assertStatus(200);

        $item = collect($indexResponse->json('data'))->firstWhere('product_variant_id', $this->product->id);
        $this->assertNotNull($item);
        $this->assertEquals(120, $item['on_hand_qty']);
        $this->assertEquals(30, $item['reserved_qty']);
        $this->assertEquals(90, $item['available_qty']);
        $this->assertEquals('NORMAL', $item['status']);
    }

    public function test_reservation_rejected_when_requested_quantity_exceeds_available_stock()
    {
        Sanctum::actingAs($this->user);

        // Reserve 100 out of 120 available
        $this->postJson('/api/inventory/reserve', [
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 100,
        ])->assertStatus(200);

        // Attempting to reserve 30 more (only 20 available) must fail
        $failResponse = $this->postJson('/api/inventory/reserve', [
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 30,
        ]);

        $failResponse->assertStatus(500);
        $this->assertStringContainsString('Cannot reserve 30 Box because only 20 Box is available.', $failResponse->json('message'));
    }

    public function test_cancelling_reservation_releases_reserved_stock_back_to_available()
    {
        Sanctum::actingAs($this->user);

        $res = app(ReservationService::class)->reserve([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 50,
        ]);

        $cancelResponse = $this->postJson("/api/inventory/reservations/{$res->id}/cancel");
        $cancelResponse->assertStatus(200);

        $this->assertDatabaseHas('inventory_reservations', [
            'id' => $res->id,
            'status' => 'CANCELLED',
        ]);

        // Verify Available stock is 120 again
        $indexResponse = $this->getJson('/api/inventory');
        $item = collect($indexResponse->json('data'))->firstWhere('product_variant_id', $this->product->id);
        $this->assertEquals(120, $item['available_qty']);
        $this->assertEquals(0, $item['reserved_qty']);
    }

    public function test_low_stock_warning_status_triggers_on_available_stock()
    {
        Sanctum::actingAs($this->user);

        // Low stock warning level is 20 Box.
        // Currently On Hand = 120, Reserved = 105 -> Available = 15 Box (which is <= 20)
        app(ReservationService::class)->reserve([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 105,
        ]);

        $indexResponse = $this->getJson('/api/inventory');
        $item = collect($indexResponse->json('data'))->firstWhere('product_variant_id', $this->product->id);

        $this->assertEquals(120, $item['on_hand_qty']);
        $this->assertEquals(105, $item['reserved_qty']);
        $this->assertEquals(15, $item['available_qty']);
        $this->assertEquals('LOW_STOCK', $item['status']);
        $this->assertEquals('Low Stock', $item['stock_status']);
    }

    public function test_can_update_product_low_stock_warning_level()
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson("/api/product/variants/{$this->product->id}/low-stock-settings", [
            'low_stock_warning_level' => 50,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('product_variants', [
            'id' => $this->product->id,
            'low_stock_warning_level' => 50.0000,
        ]);
    }

    public function test_tenant_isolation_prevents_other_organization_from_accessing_reservations()
    {
        $otherOrg = Organization::create(['name' => 'Other Org', 'code' => 'TEST-ORG-2', 'slug' => 'other-org']);
        $otherUser = User::factory()->create(['organization_id' => $otherOrg->id]);

        $res = app(ReservationService::class)->reserve([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 10,
        ]);

        Sanctum::actingAs($otherUser);

        $response = $this->getJson("/api/inventory/reservations/{$res->id}");
        $response->assertStatus(404);
    }
}
