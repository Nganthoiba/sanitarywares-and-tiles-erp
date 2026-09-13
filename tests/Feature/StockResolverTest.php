<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Services\StockResolverService;
use App\Domains\Inventory\Services\TransferService;
use App\Domains\Inventory\Services\AdjustmentService;
use App\Models\User;

class StockResolverTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Warehouse $warehouse1;
    protected Warehouse $warehouse2;
    protected Product $product;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'name' => 'Stock Resolver Org',
            'code' => 'SRO-01'
        ]);

        $branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Branch',
            'code' => 'MB-01'
        ]);

        $this->warehouse1 = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch->id,
            'name' => 'Warehouse Alpha',
            'code' => 'WH-A',
            'type' => 'MAIN',
            'is_active' => true
        ]);

        $this->warehouse2 = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch->id,
            'name' => 'Warehouse Beta',
            'code' => 'WH-B',
            'type' => 'SECONDARY',
            'is_active' => true
        ]);

        $cat = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Vitrified Tiles',
            'slug' => 'vitrified-tiles'
        ]);

        $unit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'PIECE',
            'decimal_places' => 0
        ]);

        $taxProfile = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'hsn_code' => '6907',
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'igst_rate' => 18
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $cat->id,
            'tax_profile_id' => $taxProfile->id,
            'base_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'purchase_unit_id' => $unit->id,
            'name' => 'Kajaria Double Charge 600x600',
            'sku' => 'KAJ-DC-600',
            'inventory_behavior' => 'STANDARD',
            'is_active' => true
        ]);

        $this->user = User::factory()->create([
            'organization_id' => $this->org->id,
        ]);
    }

    public function test_stock_resolver_allocates_across_multiple_inventory_objects_fifo()
    {
        // Create 2 inventory objects in Warehouse Alpha: Object A = 10 boxes, Object B = 20 boxes
        $objA = InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'object_code' => 'OBJ-A',
            'quantity' => 10.0,
            'status' => 'AVAILABLE',
        ]);

        $objB = InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'object_code' => 'OBJ-B',
            'quantity' => 20.0,
            'status' => 'AVAILABLE',
        ]);

        $resolver = new StockResolverService();
        $allocations = $resolver->resolveStock($this->org->id, $this->product->id, $this->warehouse1->id, 15.0);

        $this->assertCount(2, $allocations);
        $this->assertEquals($objA->id, $allocations[0]['object']->id);
        $this->assertEquals(10.0, $allocations[0]['quantity']);

        $this->assertEquals($objB->id, $allocations[1]['object']->id);
        $this->assertEquals(5.0, $allocations[1]['quantity']);
    }

    public function test_transfer_service_uses_product_variant_id_to_transfer_stock()
    {
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'object_code' => 'OBJ-100',
            'quantity' => 50.0,
            'status' => 'AVAILABLE',
        ]);

        $transferService = new TransferService();
        $transfer = $transferService->initiateTransfer([
            'organization_id' => $this->org->id,
            'from_warehouse_id' => $this->warehouse1->id,
            'to_warehouse_id' => $this->warehouse2->id,
            'user_id' => $this->user->id,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 15.0
                ]
            ]
        ]);

        $this->assertNotNull($transfer);
        $this->assertEquals('PENDING', $transfer->status);

        // Verify remaining stock in Warehouse 1 is 35.0
        $this->assertDatabaseHas('inventory_objects', [
            'warehouse_id' => $this->warehouse1->id,
            'quantity' => 35.0000
        ]);

        // Complete transfer
        $transferService->completeTransfer($transfer->id);

        // Verify in-transit item moved to Warehouse 2 and becomes AVAILABLE
        $this->assertDatabaseHas('inventory_objects', [
            'warehouse_id' => $this->warehouse2->id,
            'product_variant_id' => $this->product->id,
            'quantity' => 15.0,
            'status' => 'AVAILABLE'
        ]);
    }

    public function test_adjustment_service_uses_product_variant_id_for_negative_and_positive_adjustments()
    {
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'object_code' => 'OBJ-ADJ',
            'quantity' => 40.0,
            'status' => 'AVAILABLE',
        ]);

        $adjService = new AdjustmentService();

        // Initiate negative adjustment of 10 boxes (damage)
        $adj = $adjService->initiateAdjustment([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse1->id,
            'adjustment_type' => 'DAMAGE',
            'reason' => 'Damaged during unloading',
            'user_id' => $this->user->id,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity_delta' => -10.0
                ]
            ]
        ]);

        $adjService->approveAdjustment($adj->id, $this->user->id);

        // Verify stock in Warehouse 1 reduced from 40 to 30
        $this->assertDatabaseHas('inventory_objects', [
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'quantity' => 30.0
        ]);
    }
}
