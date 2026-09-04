<?php

namespace Tests\Feature;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\GoodsReceiptItem;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use App\Domains\Purchase\Services\GRNService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryGRNIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_grn_stock_is_reflected_in_inventory_api(): void
    {
        // 1. Setup Organization, Branch, Warehouse, Units, Users
        $organization = Organization::create(['name' => 'Test Tile & Marble Corp', 'code' => 'ORG-TEST-01']);
        $branch = \App\Domains\Master\Models\Branch::create([
            'organization_id' => $organization->id,
            'name' => 'Main Branch',
            'code' => 'BR-MAIN',
            'is_active' => true,
        ]);
        $warehouse = Warehouse::create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'HQ Central Warehouse',
            'code' => 'WH-HQ-01',
            'type' => 'MAIN',
            'is_active' => true,
        ]);

        $pcsUnit = Unit::create(['name' => 'Piece', 'symbol' => 'PCS', 'type' => 'QUANTITY']);
        $sqftUnit = Unit::create(['name' => 'Square Feet', 'symbol' => 'SQFT', 'type' => 'AREA']);

        $taxProfile = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $organization->id,
            'name' => 'GST 18%',
            'code' => 'GST18',
            'tax_rate' => 18.00,
            'is_active' => true,
        ]);

        // Standard Bulk Product (e.g. Ceramic Tiles)
        $tileProduct = Product::create([
            'organization_id' => $organization->id,
            'name' => 'Ceramic Floor Tile 600x600',
            'sku' => 'TILE-CER-600',
            'inventory_behavior' => 'STANDARD',
            'base_unit_id' => $pcsUnit->id,
            'purchase_unit_id' => $pcsUnit->id,
            'sales_unit_id' => $pcsUnit->id,
            'tax_profile_id' => $taxProfile->id,
        ]);

        // Slab Product (e.g. Italian Marble)
        $slabProduct = Product::create([
            'organization_id' => $organization->id,
            'name' => 'Italian White Marble Slab',
            'sku' => 'MARBLE-ITA-WHT',
            'inventory_behavior' => 'SLAB',
            'base_unit_id' => $sqftUnit->id,
            'purchase_unit_id' => $sqftUnit->id,
            'sales_unit_id' => $sqftUnit->id,
            'tax_profile_id' => $taxProfile->id,
        ]);

        $user = User::factory()->create(['organization_id' => $organization->id]);

        // 2. Create GRN
        $grn = GoodsReceiptNote::create([
            'organization_id' => $organization->id,
            'warehouse_id' => $warehouse->id,
            'grn_number' => 'GRN-TEST-999',
            'batch_number' => 'BATCH-TEST-999',
            'received_date' => now(),
            'status' => GoodsReceiptStatus::DRAFT->value,
        ]);

        // Item 1: 50 PCS of Tiles
        $tileItem = GoodsReceiptItem::create([
            'organization_id' => $organization->id,
            'goods_receipt_note_id' => $grn->id,
            'product_variant_id' => $tileProduct->id,
            'unit_id' => $pcsUnit->id,
            'quantity_received' => 50.0000,
            'quantity_accepted' => 50.0000,
        ]);

        // Item 2: 1 Slab of Italian Marble (120 x 60 inches = 50 SQFT)
        $slabItem = GoodsReceiptItem::create([
            'organization_id' => $organization->id,
            'goods_receipt_note_id' => $grn->id,
            'product_variant_id' => $slabProduct->id,
            'unit_id' => $sqftUnit->id,
            'quantity_received' => 1.0000,
            'quantity_accepted' => 1.0000,
        ]);

        $slabItem->slabs()->create([
            'organization_id' => $organization->id,
            'length' => 120.00,
            'width' => 60.00,
            'thickness' => 20.00,
            'finish' => 'POLISHED',
            'origin' => 'ITALY',
        ]);

        // 3. Approve GRN
        $grnService = app(GRNService::class);
        $grnService->approveGRN($grn->id);

        // 4. Fetch Inventory via API /api/inventory
        $response = $this->actingAs($user)
            ->withHeader('X-Organization-Id', $organization->id)
            ->getJson('/api/inventory');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Assert Bulk Tile Inventory object is returned
        $tileStock = collect($data)->firstWhere('product_variant_id', $tileProduct->id);
        $this->assertNotNull($tileStock);
        $this->assertEquals('Ceramic Floor Tile 600x600', $tileStock['variant_name']);
        $this->assertEquals(50.0, $tileStock['quantity']);
        $this->assertEquals('PCS', $tileStock['unit_symbol']);
        $this->assertEquals('HQ Central Warehouse', $tileStock['warehouse_name']);
        $this->assertEquals('AVAILABLE', $tileStock['status']);

        // Assert Marble Slab Inventory object is returned
        $slabStock = collect($data)->firstWhere('product_variant_id', $slabProduct->id);
        $this->assertNotNull($slabStock);
        $this->assertEquals('Italian White Marble Slab', $slabStock['variant_name']);
        $this->assertEquals(1.0, $slabStock['quantity']);
        $this->assertEquals(50.0, $slabStock['area']);
        $this->assertEquals(120.0, $slabStock['length']);
        $this->assertEquals(60.0, $slabStock['width']);
        $this->assertEquals('AVAILABLE', $slabStock['status']);
    }
}
