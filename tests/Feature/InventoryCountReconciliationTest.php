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
use App\Domains\Inventory\Models\InventoryCount;
use App\Domains\Inventory\Models\InventoryCountItem;
use App\Domains\Inventory\Models\InventoryAdjustment;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Services\InventoryCountService;
use Exception;

class InventoryCountReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected Product $product;
    protected InventoryCountService $countService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create(['code' => 'TEST-ORG-1', 'name' => 'Test Tile & Sanitaryware Corp']);
        app(\App\Shared\Context\TenantContext::class)->setOrganization($this->org);
        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'code' => 'MAIN-BR',
            'name' => 'Main Branch'
        ]);
        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'code' => 'MAIN-WH',
            'name' => 'Main Warehouse',
            'type' => 'MAIN',
            'is_active' => true
        ]);

        $cat = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles'
        ]);
        $unit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'BOX'
        ]);

        $gst18 = \App\Domains\Master\Models\TaxProfile::create([
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
            'purchase_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'name' => '60x60 Polished Vitrified Tile',
            'sku' => 'TILE-6060-PV',
            'inventory_behavior' => 'BULK',
            'tax_profile_id' => $gst18->id
        ]);

        $this->user = \App\Models\User::create([
            'name' => 'Audit Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password')
        ]);

        $this->countService = app(InventoryCountService::class);
    }

    public function test_stock_count_reconciliation_workflow_prevents_direct_stock_overwrites_and_uses_adjustment_movement(): void
    {
        // 1. Setup initial stock object
        $invObj = InventoryObject::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->product->id,
            'status' => 'ON_HAND',
            'object_code' => 'BULK-TILE-100',
            'quantity' => 100.0000,
            'area' => 500.0000
        ]);

        // 2. Initiate Stock Count (Captures System Qty)
        $count = $this->countService->initiateCount([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'count_type' => 'CYCLE',
            'remarks' => 'Monthly Audit',
            'user_id' => $this->user->id
        ]);

        $this->assertInstanceOf(InventoryCount::class, $count);
        $this->assertEquals('PENDING', $count->status);
        $this->assertCount(1, $count->items);

        $item = $count->items->first();
        $this->assertEquals(100.0, (float) $item->recorded_quantity);
        $this->assertEquals(100.0, (float) $item->counted_quantity);
        $this->assertEquals(0.0, (float) $item->variance_quantity);

        // 3. Record Physical Count with Variance & Reason
        $this->countService->updateCountQuantity(
            $item->id,
            95.0, // Physical count is 95 (Variance of -5)
            475.0, // Area is 475 (Variance of -25)
            'Broken tiles during warehouse handling'
        );

        $item->refresh();
        $this->assertEquals(95.0, (float) $item->counted_quantity);
        $this->assertEquals(-5.0, (float) $item->variance_quantity);
        $this->assertEquals(-25.0, (float) $item->variance_area);
        $this->assertEquals('Broken tiles during warehouse handling', $item->reason);

        // Stock object MUST remain unchanged before approval
        $invObj->refresh();
        $this->assertEquals(100.0, (float) $invObj->quantity);

        // 4. Approve Count (Triggers Adjustment Movement)
        $this->countService->approveCount($count->id, $this->user->id);

        $count->refresh();
        $this->assertEquals('APPROVED', $count->status);
        $this->assertEquals($this->user->id, $count->approved_by);

        // Verify stock object balance was updated cleanly via movement
        $invObj->refresh();
        $this->assertEquals(95.0, (float) $invObj->quantity);
        $this->assertEquals(475.0, (float) $invObj->area);

        // Verify InventoryAdjustment record was created
        $adj = InventoryAdjustment::where('organization_id', $this->org->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertNotNull($adj);
        $this->assertEquals('APPROVED', $adj->status);

        // Verify InventoryMovement ledger entry was generated
        $movement = InventoryMovement::where('inventory_object_id', $invObj->id)
            ->orderBy('id', 'desc')
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(-5.0, (float) $movement->quantity_delta);
        $this->assertEquals(-25.0, (float) $movement->area_delta);
    }

    public function test_cannot_approve_already_approved_count(): void
    {
        $count = $this->countService->initiateCount([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'user_id' => $this->user->id
        ]);

        $this->countService->approveCount($count->id, $this->user->id);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage("Count is already approved or resolved.");

        $this->countService->approveCount($count->id, $this->user->id);
    }
}
