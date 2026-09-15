<?php

namespace Tests\Feature;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Services\ValuationService;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Product\Models\OrganizationProductPricing;
use App\Domains\Product\Models\Product;
use App\Domains\Sales\Services\SalesService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InventoryAccountingValuationTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Warehouse $warehouse;
    protected Product $bulkProduct;
    protected Product $slabProduct;
    protected ValuationService $valuationService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'name' => 'Royal Granites & Tiles',
            'code' => 'RGT-01',
            'is_active' => true,
        ]);

        $branch = \App\Domains\Master\Models\Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'HQ Branch',
            'code' => 'BR-HQ',
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch->id,
            'name' => 'Central Depot',
            'code' => 'WH-DEPOT',
            'is_active' => true,
        ]);

        $cat = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Floor Tiles',
            'slug' => 'floor-tiles',
            'is_active' => true,
        ]);

        $brand = Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Kajaria',
            'slug' => 'kajaria',
            'is_active' => true,
        ]);

        $unit = Unit::create([
            'name' => 'Boxes',
            'symbol' => 'BOX',
            'type' => 'MEASUREMENT',
            'decimal_places' => 0,
        ]);

        $tax = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'igst_rate' => 18,
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'is_active' => true,
        ]);

        // 1. Bulk Tile Product Variant
        $this->bulkProduct = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'tax_profile_id' => $tax->id,
            'name' => 'Kajaria Vitrified 60x60',
            'sku' => 'KAJ-VIT-6060',
            'inventory_behavior' => 'BULK',
            'purchase_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'is_active' => true,
        ]);

        OrganizationProductPricing::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->bulkProduct->id,
            'cost_price' => 450.00,
            'selling_price' => 600.00,
            'is_current' => true,
        ]);

        // 2. Slab Granite Product Variant
        $this->slabProduct = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'tax_profile_id' => $tax->id,
            'name' => 'Black Galaxy Granite Slab',
            'sku' => 'GNT-BLK-GAL',
            'inventory_behavior' => 'SLAB',
            'purchase_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'is_active' => true,
        ]);

        OrganizationProductPricing::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->slabProduct->id,
            'cost_price' => 120.00,
            'selling_price' => 180.00,
            'is_current' => true,
        ]);

        $this->valuationService = app(ValuationService::class);
    }

    /** @test */
    public function test_weighted_average_cost_policy_for_bulk_items()
    {
        // Seed 2 GRN receipts at different costs:
        // Batch 1: 100 boxes @ ₹400
        // Batch 2: 100 boxes @ ₹500
        // Expected WAC = (100*400 + 100*500) / 200 = ₹450
        $grnId = DB::table('goods_receipt_notes')->insertGetId([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'grn_number' => 'GRN-WAC-001',
            'received_date' => date('Y-m-d'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('goods_receipt_items')->insert([
            [
                'organization_id' => $this->org->id,
                'goods_receipt_note_id' => $grnId,
                'product_variant_id' => $this->bulkProduct->id,
                'quantity_received' => 100,
                'quantity_accepted' => 100,
                'unit_price' => 400.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'organization_id' => $this->org->id,
                'goods_receipt_note_id' => $grnId,
                'product_variant_id' => $this->bulkProduct->id,
                'quantity_received' => 100,
                'quantity_accepted' => 100,
                'unit_price' => 500.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $unitCost = $this->valuationService->getUnitCost($this->bulkProduct);
        $this->assertEquals(450.00, $unitCost);
    }

    /** @test */
    public function test_specific_identification_cost_policy_for_slabs()
    {
        $slabObj = InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->slabProduct->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'SLAB-SPEC-001',
            'quantity' => 1,
            'area' => 45.5,
            'status' => 'AVAILABLE',
        ]);

        $grnId = DB::table('goods_receipt_notes')->insertGetId([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'grn_number' => 'GRN-SLAB-001',
            'received_date' => date('Y-m-d'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('goods_receipt_items')->insert([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grnId,
            'product_variant_id' => $this->slabProduct->id,
            'inventory_object_id' => $slabObj->id,
            'quantity_received' => 1,
            'quantity_accepted' => 1,
            'unit_price' => 135.00, // Specific purchase cost for this slab
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitCost = $this->valuationService->getUnitCost($this->slabProduct, $slabObj);
        $this->assertEquals(135.00, $unitCost);
    }

    /** @test */
    public function test_total_inventory_valuation_trace_calculation()
    {
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->bulkProduct->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'BULK-STOCK-001',
            'quantity' => 200,
            'area' => 0,
            'status' => 'AVAILABLE',
        ]);

        InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->slabProduct->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'SLAB-STOCK-001',
            'quantity' => 1,
            'area' => 50,
            'status' => 'AVAILABLE',
        ]);

        $valuation = $this->valuationService->calculateTotalInventoryValuation($this->org->id);

        $this->assertNotNull($valuation);
        // Bulk: 200 * 450 = 90,000
        // Slab: 50 * 120 = 6,000
        // Total = 96,000
        $this->assertEquals(96000.00, $valuation['total_valuation']);
        $this->assertEquals(90000.00, $valuation['bulk_valuation']);
        $this->assertEquals(6000.00, $valuation['slab_valuation']);
    }
}
