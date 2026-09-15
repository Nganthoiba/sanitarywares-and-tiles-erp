<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryTransfer;
use App\Domains\Inventory\Services\TransferService;
use App\Domains\Inventory\Services\StockResolverService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InventoryStockTransferResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $fromWarehouse;
    protected Warehouse $toWarehouse;
    protected Unit $boxUnit;
    protected Product $product;
    protected TransferService $transferService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->transferService = app(TransferService::class);

        $this->org = Organization::create([
            'name' => 'Stock Resolution Tile Enterprise',
            'code' => 'ORG-TRF-01',
            'state' => 'Manipur',
            'is_active' => true,
        ]);

        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Branch',
            'code' => 'BR-01',
            'is_active' => true,
        ]);

        $this->fromWarehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Depot',
            'code' => 'WH-DEPOT',
            'is_active' => true,
        ]);

        $this->toWarehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'City Showroom Yard',
            'code' => 'WH-SHOWROOM',
            'is_active' => true,
        ]);

        $this->boxUnit = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'category' => 'COUNT',
            'is_base' => true,
        ]);

        $taxProfile = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'hsn_code' => '69072100',
            'rate' => 18.00,
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'name' => 'Standard Floor Tile 60x60',
            'sku' => 'TILE-6060-STD',
            'base_unit_id' => $this->boxUnit->id,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $taxProfile->id,
            'inventory_behavior' => 'STANDARD',
            'is_active' => true,
        ]);

        // Stock split across two physical objects in source warehouse
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->fromWarehouse->id,
            'product_variant_id' => $this->product->id,
            'object_code' => 'BATCH-A-100',
            'quantity' => 20.0,
            'area' => 0.0,
            'status' => 'AVAILABLE',
            'created_at' => now()->subDays(5),
        ]);

        InventoryObject::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->fromWarehouse->id,
            'product_variant_id' => $this->product->id,
            'object_code' => 'BATCH-B-100',
            'quantity' => 30.0,
            'area' => 0.0,
            'status' => 'AVAILABLE',
            'created_at' => now()->subDays(2),
        ]);
    }

    /** @test */
    public function it_transfers_stock_using_product_variant_id_and_quantity_without_requiring_object_ids()
    {
        // User requests transfer of 35 Boxes of tile from Central Depot to City Showroom Yard
        // User only provides product_variant_id and quantity (No inventory_object_id needed)
        $transfer = $this->transferService->initiateTransfer([
            'organization_id' => $this->org->id,
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'remarks' => 'Stock transfer from Central Depot to City Showroom Yard',
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 35.0,
                ],
            ],
        ]);

        $this->assertNotNull($transfer->id);
        $this->assertMatchesRegularExpression('/^TRF\/\d{2}-\d{2}\/\d{6}$/', $transfer->transfer_number);
        $this->assertEquals('PENDING', $transfer->status);

        // Verify source warehouse stock reduction (20 taken from Batch A [depleted], 15 taken from Batch B [15 remain])
        $depotStock = InventoryObject::where('warehouse_id', $this->fromWarehouse->id)
            ->where('product_variant_id', $this->product->id)
            ->where('status', 'AVAILABLE')
            ->sum('quantity');

        $this->assertEquals(15.0, (float) $depotStock);

        // Complete the transfer (receiving at destination)
        $this->transferService->completeTransfer($transfer->id);

        $this->assertEquals('RECEIVED', $transfer->fresh()->status);

        $showroomStock = InventoryObject::where('warehouse_id', $this->toWarehouse->id)
            ->where('product_variant_id', $this->product->id)
            ->where('status', 'AVAILABLE')
            ->sum('quantity');

        $this->assertEquals(35.0, (float) $showroomStock);
    }
}
