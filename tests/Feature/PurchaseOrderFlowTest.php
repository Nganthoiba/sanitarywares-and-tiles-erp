<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Supplier;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Product\Models\UnitConversion;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\PurchaseOrderItem;
use App\Domains\Purchase\Models\PurchaseRequisition;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\GoodsReceiptItem;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use App\Domains\Purchase\Services\PurchaseOrderService;
use App\Domains\Purchase\Services\GRNService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;
use Illuminate\Support\Facades\DB;

class PurchaseOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Branch $branch;
    protected Supplier $supplier;
    protected Unit $pcsUnit;
    protected Unit $boxUnit;
    protected Unit $sqftUnit;
    protected Unit $slabUnit;
    protected ProductVariant $tileVariant;
    protected ProductVariant $sanitaryVariant;
    protected ProductVariant $graniteVariant;
    protected ProductVariant $marbleVariant;
    protected PurchaseOrderService $poService;
    protected GRNService $grnService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'name' => 'Apex Test Org',
            'code' => 'APEX',
            'is_active' => true,
            'settings' => ['over_receipt_policy' => 'STRICT']
        ]);

        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Operator A',
            'email' => 'operator@apex.com',
            'password' => bcrypt('password'),
        ]);

        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Apex Branch',
            'code' => 'BR-APEX',
            'is_active' => true,
        ]);

        $this->supplier = Supplier::create([
            'organization_id' => $this->org->id,
            'name' => 'Apex Supplier',
            'code' => 'SUPP-APEX',
            'is_active' => true,
        ]);

        // Create UOMs
        $this->pcsUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Piece',
            'symbol' => 'PCS',
            'type' => 'QUANTITY',
        ]);

        $this->boxUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
        ]);

        $this->sqftUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Square Foot',
            'symbol' => 'SQFT',
            'type' => 'AREA',
        ]);

        $this->slabUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Slab',
            'symbol' => 'SLAB',
            'type' => 'QUANTITY',
        ]);

        $tax = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'hsn_code' => '6907',
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'igst_rate' => 18,
            'is_active' => true,
        ]);

        $category = \App\Domains\Master\Models\Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Tiles & Stones',
            'slug' => 'tiles-stones',
        ]);

        $family = \App\Domains\Product\Models\ProductFamily::create([
            'organization_id' => $this->org->id,
            'name' => 'General Family',
            'code' => 'GEN-FAM',
            'category_id' => $category->id,
            'tax_profile_id' => $tax->id,
        ]);

        // Tile variant (BOX -> PCS conversion)
        $this->tileVariant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $family->id,
            'tax_profile_id' => $tax->id,
            'sku' => 'TILE-600X600',
            'name' => 'Ceramic Tile 600x600',
            'inventory_behavior' => 'CONVERTIBLE',
            'cost_price' => 800.0000,
            'sale_price' => 1200.0000,
            'base_unit_id' => $this->pcsUnit->id,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'is_active' => true,
        ]);

        // Unit conversion: 1 BOX = 4 PCS
        UnitConversion::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'from_unit_id' => $this->boxUnit->id,
            'to_unit_id' => $this->pcsUnit->id,
            'multiplier' => 4.000000,
        ]);

        // Sanitary variant (PCS -> PCS)
        $this->sanitaryVariant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $family->id,
            'tax_profile_id' => $tax->id,
            'sku' => 'SAN-BASIN',
            'name' => 'Wash Basin',
            'inventory_behavior' => 'STANDARD',
            'cost_price' => 2500.0000,
            'sale_price' => 3500.0000,
            'base_unit_id' => $this->pcsUnit->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'is_active' => true,
        ]);

        // Granite variant (SLAB -> SQFT)
        $this->graniteVariant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $family->id,
            'tax_profile_id' => $tax->id,
            'sku' => 'GRAN-BLACK',
            'name' => 'Black Granite',
            'inventory_behavior' => 'SLAB',
            'cost_price' => 180.0000,
            'sale_price' => 280.0000,
            'base_unit_id' => $this->pcsUnit->id,
            'purchase_unit_id' => $this->slabUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'is_active' => true,
        ]);

        // Marble variant (SLAB -> SQFT)
        $this->marbleVariant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $family->id,
            'tax_profile_id' => $tax->id,
            'sku' => 'MARB-WHITE',
            'name' => 'White Marble',
            'inventory_behavior' => 'SLAB',
            'cost_price' => 250.0000,
            'sale_price' => 350.0000,
            'base_unit_id' => $this->pcsUnit->id,
            'purchase_unit_id' => $this->slabUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'is_active' => true,
        ]);

        $this->poService = app(PurchaseOrderService::class);
        $this->grnService = app(GRNService::class);
    }

    /**
     * 1. Tile purchased in BOX and priced per BOX.
     */
    public function test_tile_purchased_in_box_priced_per_box(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'quantity' => 10, // 10 BOX
                    'unit_id' => $this->boxUnit->id,
                    'pricing_unit_id' => $this->boxUnit->id,
                    'unit_price' => 800.00, // ₹800/BOX
                ]
            ]
        ], $this->org->id);

        $this->assertEquals(8000.0, (float) $po->items->first()->subtotal - (float) $po->items->first()->tax_amount);
    }

    /**
     * 2. Tile purchased in BOX and converted to PCS for inventory.
     */
    public function test_tile_purchased_in_box_converted_to_pcs_for_inventory(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'quantity' => 10, // 10 BOX
                    'unit_id' => $this->boxUnit->id,
                    'pricing_unit_id' => $this->pcsUnit->id, // priced by PCS
                    'unit_price' => 200.00, // ₹200/PCS
                ]
            ]
        ], $this->org->id);

        // 10 BOX = 40 PCS. Subtotal = 40 * ₹200 = ₹8000.
        $this->assertEquals(8000.0, (float) $po->items->first()->subtotal - (float) $po->items->first()->tax_amount);
    }

    /**
     * 3. Sanitary item purchased in PCS and priced per PCS.
     */
    public function test_sanitary_item_purchased_in_pcs_priced_per_pcs(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->sanitaryVariant->id,
                    'quantity' => 20, // 20 PCS
                    'unit_id' => $this->pcsUnit->id,
                    'pricing_unit_id' => $this->pcsUnit->id,
                    'unit_price' => 2500.00, // ₹2500/PCS
                ]
            ]
        ], $this->org->id);

        $this->assertEquals(50000.0, (float) $po->items->first()->subtotal - (float) $po->items->first()->tax_amount);
    }

    /**
     * 4. Granite purchased in SLABS and priced per SQ.FT.
     */
    public function test_granite_purchased_in_slabs_priced_per_sqft(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'quantity' => 10, // 10 SLABS
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 200, // 200 SQFT
                    'unit_price' => 180.00, // ₹180/SQFT
                ]
            ]
        ], $this->org->id);

        $this->assertEquals(36000.0, (float) $po->items->first()->subtotal - (float) $po->items->first()->tax_amount);
    }

    /**
     * 5. Marble purchased in SLABS and priced per SQ.FT.
     */
    public function test_marble_purchased_in_slabs_priced_per_sqft(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->marbleVariant->id,
                    'quantity' => 20, // 20 SLABS
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 400, // 400 SQFT
                    'unit_price' => 250.00, // ₹250/SQFT
                ]
            ]
        ], $this->org->id);

        $this->assertEquals(100000.0, (float) $po->items->first()->subtotal - (float) $po->items->first()->tax_amount);
    }

    /**
     * 6. Granite PO does not require slab dimensions.
     */
    public function test_granite_po_does_not_require_slab_dimensions(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'quantity' => 10,
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 200,
                    'unit_price' => 180.00,
                ]
            ]
        ], $this->org->id);

        $this->assertDatabaseHas('purchase_orders', ['id' => $po->id]);
    }

    /**
     * 7. Granite PO does not calculate amount as slab_count * sq.ft_rate.
     */
    public function test_granite_po_does_not_calculate_amount_as_slab_count_times_rate(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'quantity' => 10, // 10 slabs
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 0.0000, // no expected area
                    'unit_price' => 180.00,
                ]
            ]
        ], $this->org->id);

        // Subtotal must be 0 (Pending actual area)
        $this->assertEquals(0.0, (float) $po->items->first()->subtotal);
    }

    /**
     * 8. Granite GRN captures individual slab dimensions.
     * 9. Granite GRN calculates actual area.
     * 10. Granite inventory objects preserve slab count and area.
     */
    public function test_granite_grn_captures_slab_dimensions_and_posts_to_inventory(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'quantity' => 2,
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 40.0,
                    'unit_price' => 180.00,
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->approve($po->id);
        $po = $this->poService->send($po->id);

        // Create warehouse
        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Store',
            'code' => 'CSTORE',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc A',
            'location_type' => 'ZONE',
            'code' => 'LOC-A'
        ]);

        // Draft GRN
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'grn_number' => 'GRN-GRAN-01',
            'received_date' => now()->toDateString(),
            'status' => 'DRAFT',
        ]);

        $grnItem = GoodsReceiptItem::create([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grn->id,
            'purchase_order_item_id' => $po->items->first()->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->slabUnit->id,
            'quantity_received' => 2.0,
            'quantity_accepted' => 2.0,
            'quantity_rejected' => 0.0,
        ]);

        // Slab 1: 10 * 12 inches = 120 / 144 = 0.8333 SQFT
        // Slab 2: 12 * 12 inches = 144 / 144 = 1.0000 SQFT
        // Total area = 1.8333 SQFT
        $grnItem->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 10.0,
            'width' => 12.0,
            'thickness' => 20.0,
        ]);

        $grnItem->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 12.0,
            'width' => 12.0,
            'thickness' => 20.0,
        ]);

        $this->grnService->approveGRN($grn->id);

        $grnItem->refresh();
        $this->assertEquals(1.8333, round((float) $grnItem->received_pricing_quantity, 4));

        // Check inventory object preserves slab details
        $this->assertDatabaseCount('inventory_objects', 2);
        $this->assertDatabaseHas('inventory_objects', [
            'product_variant_id' => $this->graniteVariant->id,
            'quantity' => 1.0,
            'area' => 1.0,
        ]);
    }

    /**
     * 11. PO remaining quantity is tracked in purchase units.
     * 12. Actual received area is tracked separately.
     * 13. Partial granite receipt works correctly.
     */
    public function test_partial_granite_receipt_tracks_remaining_slabs_and_received_area(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'quantity' => 10, // 10 SLABS
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 200,
                    'unit_price' => 180.00,
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->approve($po->id);
        $po = $this->poService->send($po->id);

        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Store',
            'code' => 'CSTORE',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc A',
            'location_type' => 'ZONE',
            'code' => 'LOC-A'
        ]);

        // Receive 6 slabs first
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'grn_number' => 'GRN-PARTIAL',
            'received_date' => now()->toDateString(),
            'status' => 'DRAFT',
        ]);

        $grnItem = GoodsReceiptItem::create([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grn->id,
            'purchase_order_item_id' => $po->items->first()->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->slabUnit->id,
            'quantity_received' => 6.0,
            'quantity_accepted' => 6.0,
            'quantity_rejected' => 0.0,
        ]);

        // Each slab is 12 x 12 inches = 1.0 SQFT -> total area = 6.0 SQFT
        for ($i = 0; $i < 6; $i++) {
            $grnItem->slabs()->create([
                'organization_id' => $this->org->id,
                'length' => 12.0,
                'width' => 12.0,
                'thickness' => 20.0,
            ]);
        }

        $this->grnService->approveGRN($grn->id);

        $poItem = PurchaseOrderItem::find($po->items->first()->id);
        $this->assertEquals(6.0, (float) $poItem->received_quantity); // 6 Slabs received
        $this->assertEquals(6.0, (float) $poItem->received_pricing_quantity); // 6.0 SQFT received
        
        $po->refresh();
        $this->assertEquals('PARTIALLY_RECEIVED', $po->status);
    }

    /**
     * 14. Full granite receipt works correctly.
     */
    public function test_full_granite_receipt_transitions_to_fully_received(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'quantity' => 2, // 2 slabs
                    'unit_id' => $this->slabUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id,
                    'estimated_pricing_quantity' => 40.0,
                    'unit_price' => 180.00,
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->approve($po->id);
        $po = $this->poService->send($po->id);

        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Store',
            'code' => 'CSTORE',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc A',
            'location_type' => 'ZONE',
            'code' => 'LOC-A'
        ]);

        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'grn_number' => 'GRN-FULL',
            'received_date' => now()->toDateString(),
            'status' => 'DRAFT',
        ]);

        $grnItem = GoodsReceiptItem::create([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grn->id,
            'purchase_order_item_id' => $po->items->first()->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->slabUnit->id,
            'quantity_received' => 2.0,
            'quantity_accepted' => 2.0,
            'quantity_rejected' => 0.0,
        ]);

        for ($i = 0; $i < 2; $i++) {
            $grnItem->slabs()->create([
                'organization_id' => $this->org->id,
                'length' => 12.0,
                'width' => 12.0,
                'thickness' => 20.0,
            ]);
        }

        $this->grnService->approveGRN($grn->id);

        $po->refresh();
        $this->assertEquals('FULLY_RECEIVED', $po->status);
    }

    /**
     * 15. Over-receipt is rejected under STRICT policy.
     */
    public function test_over_receipt_strict_policy_rejects_excess_goods_receipt(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->sanitaryVariant->id,
                    'quantity' => 5,
                    'unit_id' => $this->pcsUnit->id,
                    'pricing_unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.0,
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->approve($po->id);
        $po = $this->poService->send($po->id);

        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Store',
            'code' => 'CSTORE',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc A',
            'location_type' => 'ZONE',
            'code' => 'LOC-A'
        ]);

        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'grn_number' => 'GRN-OVER',
            'received_date' => now()->toDateString(),
            'status' => 'DRAFT',
        ]);

        GoodsReceiptItem::create([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grn->id,
            'purchase_order_item_id' => $po->items->first()->id,
            'product_variant_id' => $this->sanitaryVariant->id,
            'unit_id' => $this->pcsUnit->id,
            'quantity_received' => 6.0, // 6 instead of 5
            'quantity_accepted' => 6.0,
            'quantity_rejected' => 0.0,
        ]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage("Over-receipt not allowed for product");
        $this->grnService->approveGRN($grn->id);
    }

    /**
     * 16. Over-receipt requires explicit authorization under ALLOW_WITH_APPROVAL.
     * 17. No free-text remark can authorize over-receipt.
     */
    public function test_over_receipt_allowed_with_approval_requires_rbac_permission(): void
    {
        // 1. Change policy to ALLOW_WITH_APPROVAL
        $this->org->settings = ['over_receipt_policy' => 'ALLOW_WITH_APPROVAL'];
        $this->org->save();

        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->sanitaryVariant->id,
                    'quantity' => 5,
                    'unit_id' => $this->pcsUnit->id,
                    'pricing_unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.0,
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->approve($po->id);
        $po = $this->poService->send($po->id);

        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Store',
            'code' => 'CSTORE',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc A',
            'location_type' => 'ZONE',
            'code' => 'LOC-A'
        ]);

        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'grn_number' => 'GRN-OVER',
            'received_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'remarks' => 'approved over-receipt' // This free text must NOT bypass authorization now!
        ]);

        GoodsReceiptItem::create([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grn->id,
            'purchase_order_item_id' => $po->items->first()->id,
            'product_variant_id' => $this->sanitaryVariant->id,
            'unit_id' => $this->pcsUnit->id,
            'quantity_received' => 6.0,
            'quantity_accepted' => 6.0,
            'quantity_rejected' => 0.0,
        ]);

        // Attempting without permission throws exception
        try {
            $this->grnService->approveGRN($grn->id);
            $this->fail("Should have thrown an exception for missing permission.");
        } catch (Exception $e) {
            $this->assertStringContainsString("Over-receipt requires 'purchase.over_receipt.approve' permission", $e->getMessage());
        }

        // Mock TenantContext permissions to simulate holding the purchase.over_receipt.approve permission
        $tenantContext = new class($this->org->id, $this->user) extends \App\Shared\Context\TenantContext {
            public function getPermissions(): \Illuminate\Support\Collection {
                return collect(['purchase.over_receipt.approve']);
            }
        };
        $this->app->instance(\App\Shared\Context\TenantContext::class, $tenantContext);

        // Approval should succeed now
        $grnResult = $this->grnService->approveGRN($grn->id);
        $this->assertEquals(GoodsReceiptStatus::LOCKED->value, $grnResult->status);
    }

    /**
     * 18. Invalid purchase units are rejected.
     * 19. Invalid pricing units are rejected.
     */
    public function test_invalid_units_are_rejected(): void
    {
        $this->actingAs($this->user);

        // Trying to create a PO for a tile variant (which uses BOX/PCS) with SQFT unit conversion should fail
        $this->expectException(Exception::class);
        $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'quantity' => 10,
                    'unit_id' => $this->boxUnit->id,
                    'pricing_unit_id' => $this->sqftUnit->id, // No conversion from BOX to SQFT exists
                    'unit_price' => 800.00,
                ]
            ]
        ], $this->org->id);
    }

    /**
     * 20. Organization isolation is enforced.
     */
    public function test_tenant_isolation_on_purchase_orders(): void
    {
        $otherOrg = Organization::create(['name' => 'Other Tenant', 'code' => 'OTHR', 'is_active' => true]);
        
        $otherUser = User::create([
            'organization_id' => $otherOrg->id,
            'name' => 'Other Operator',
            'email' => 'other@othr.com',
            'password' => bcrypt('password')
        ]);

        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'quantity' => 5,
                    'unit_id' => $this->boxUnit->id,
                    'pricing_unit_id' => $this->boxUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        $this->actingAs($otherUser);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        PurchaseOrder::findOrFail($po->id);
    }

    /**
     * 21. Backend recalculates all monetary totals.
     */
    public function test_backend_recalculates_monetary_totals_authoritatively(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'quantity' => 10, // 10 BOX
                    'unit_id' => $this->boxUnit->id,
                    'pricing_unit_id' => $this->pcsUnit->id,
                    'unit_price' => 200.00, // ₹200/PCS
                    'discount_amount' => 10.0,
                    'tax_rate' => 18.0,
                ]
            ]
        ], $this->org->id);

        // 10 BOX = 40 PCS. Subtotal before discount = 40 * ₹200 = ₹8000.
        // Less discount: ₹8000 - ₹10 = ₹7990.
        // GST tax rate: 18% of ₹7990 = ₹1438.2.
        // Expected grand total: ₹7990 + ₹1438.2 = ₹9428.2
        $this->assertEquals(9428.2, (float) $po->total_amount);
    }

    /**
     * 22. Existing ordinary POs remain functional after migration.
     */
    public function test_existing_ordinary_pos_remain_functional_after_migration(): void
    {
        $this->actingAs($this->user);

        // Create PO item directly to simulate pre-migration state where pricing_unit_id is null
        $po = PurchaseOrder::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_number' => 'PO-OLD-01',
            'po_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 1000.0,
        ]);

        $item = PurchaseOrderItem::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'product_variant_id' => $this->tileVariant->id,
            'quantity' => 10,
            'unit_id' => $this->boxUnit->id,
            'unit_price' => 100.0,
            'subtotal' => 1000.0,
            'pricing_unit_id' => null, // simulate pre-migration nullable state
            'estimated_pricing_quantity' => null,
            'received_pricing_quantity' => 0.0000,
        ]);

        // Load po detail API show endpoint to ensure resource handles null gracefully
        $response = $this->getJson("/api/purchase-orders/{$po->id}");
        
        // Assert successful code
        $response->assertStatus(200);
        $response->assertJsonPath('data.items.0.pricing_unit_symbol', null);
    }

    /**
     * 23. Product conversion changes after PO creation does not affect historical calculations.
     */
    public function test_product_conversion_changes_after_po_creation_does_not_affect_po(): void
    {
        $this->actingAs($this->user);

        // 1. Create a PO with 10 BOX, priced per PCS (1 BOX = 4 PCS)
        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'quantity' => 10, // 10 BOX
                    'unit_id' => $this->boxUnit->id,
                    'pricing_unit_id' => $this->pcsUnit->id, // priced by PCS
                    'unit_price' => 200.00, // ₹200/PCS
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->approve($po->id);
        $po = $this->poService->send($po->id);

        // Subtotal must be 10 * 4 * 200 = 8000 (excluding tax)
        $poItem = $po->items->first();
        $this->assertEquals(8000.0, (float) $poItem->subtotal - (float) $poItem->tax_amount);

        // 2. Change the variant conversion configuration: 1 BOX = 6 PCS
        $conversion = UnitConversion::where('product_variant_id', $this->tileVariant->id)
            ->where('from_unit_id', $this->boxUnit->id)
            ->where('to_unit_id', $this->pcsUnit->id)
            ->first();
        $conversion->multiplier = 6.000000;
        $conversion->save();

        // 3. Receive the goods via GRN
        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Store',
            'code' => 'CSTORE',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc A',
            'location_type' => 'ZONE',
            'code' => 'LOC-A'
        ]);

        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'grn_number' => 'GRN-HISTORICAL',
            'received_date' => now()->toDateString(),
            'status' => 'DRAFT',
        ]);

        $grnItem = GoodsReceiptItem::create([
            'organization_id' => $this->org->id,
            'goods_receipt_note_id' => $grn->id,
            'purchase_order_item_id' => $poItem->id,
            'product_variant_id' => $this->tileVariant->id,
            'unit_id' => $this->boxUnit->id,
            'quantity_received' => 10.0, // all 10 BOX received
            'quantity_accepted' => 10.0,
            'quantity_rejected' => 0.0,
        ]);

        $this->grnService->approveGRN($grn->id);

        $poItem->refresh();
        // Since it's snapshotted, received pricing quantity should be 10 BOX * 4 = 40 (NOT 60!)
        $this->assertEquals(40.0, (float) $poItem->received_pricing_quantity);
    }
}
