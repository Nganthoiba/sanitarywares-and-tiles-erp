<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\Supplier;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Product\Models\ProductFamily;
use App\Domains\Product\Models\UnitConversion;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\GoodsReceiptItem;
use App\Domains\Purchase\Models\GoodsReceiptItemSlab;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Events\InventoryReceived;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class GRNFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Warehouse $warehouse;
    protected StorageLocation $location;
    protected Supplier $supplier;
    protected Unit $boxUnit;
    protected Unit $pcsUnit;
    protected Unit $sqftUnit;
    protected ProductVariant $tileVariant;
    protected ProductVariant $graniteVariant;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up tenant organization and user
        $this->org = Organization::create(['name' => 'Test Org', 'code' => 'TORG', 'is_active' => true]);
        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Operator A',
            'email' => 'operator@torg.com',
            'password' => bcrypt('password'),
        ]);

        // Set up master records
        $branch = \App\Domains\Master\Models\Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Branch',
            'code' => 'BR-MAIN',
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse',
            'code' => 'WH-MAIN',
            'type' => 'MAIN',
            'is_active' => true,
        ]);

        $this->location = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'name' => 'Location A1',
            'location_type' => 'ZONE',
            'code' => 'LOC-A1',
        ]);

        $this->supplier = Supplier::create([
            'organization_id' => $this->org->id,
            'name' => 'Global Supplier',
            'code' => 'SUPP-GLOB',
            'is_active' => true,
        ]);

        // Units
        $this->boxUnit = Unit::create(['organization_id' => $this->org->id, 'name' => 'Box', 'symbol' => 'BOX', 'type' => 'QUANTITY']);
        $this->pcsUnit = Unit::create(['organization_id' => $this->org->id, 'name' => 'Piece', 'symbol' => 'PCS', 'type' => 'QUANTITY']);
        $this->sqftUnit = Unit::create(['organization_id' => $this->org->id, 'name' => 'Square Feet', 'symbol' => 'SQFT', 'type' => 'AREA']);

        // Tax profile
        $tax = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'hsn_code' => '6907',
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'igst_rate' => 18,
            'is_active' => true,
        ]);

        // Categories
        $tileCat = \App\Domains\Master\Models\Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles',
        ]);

        $graniteCat = \App\Domains\Master\Models\Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Granite Slabs',
            'slug' => 'granite-slabs',
        ]);

        // Families
        $tileFamily = ProductFamily::create(['organization_id' => $this->org->id, 'name' => 'Tiles', 'code' => 'TILE-FAM', 'category_id' => $tileCat->id, 'tax_profile_id' => $tax->id]);
        $graniteFamily = ProductFamily::create(['organization_id' => $this->org->id, 'name' => 'Granites', 'code' => 'GRAN-FAM', 'category_id' => $graniteCat->id, 'tax_profile_id' => $tax->id]);

        // Product variants
        $this->tileVariant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $tileFamily->id,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Ceramic Tile Gold 600x600',
            'sku' => 'TILE-GOLD',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $tax->id,
        ]);

        $this->graniteVariant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $graniteFamily->id,
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'name' => 'Black Galaxy Granite Slab',
            'sku' => 'GRAN-BG',
            'inventory_behavior' => 'SLAB',
            'tax_profile_id' => $tax->id,
        ]);

        // Unit conversions
        // 1 BOX = 10 PCS
        UnitConversion::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'from_unit_id' => $this->boxUnit->id,
            'to_unit_id' => $this->pcsUnit->id,
            'multiplier' => 10.000000,
        ]);

        // 1 BOX = 15.5 SQFT
        UnitConversion::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'from_unit_id' => $this->boxUnit->id,
            'to_unit_id' => $this->sqftUnit->id,
            'multiplier' => 15.500000,
        ]);
    }

    public function test_grn_draft_creation()
    {
        $payload = [
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'supplier_id' => $this->supplier->id,
            'received_date' => '2026-08-09',
            'remarks' => 'Draft testing GRN',
            'items' => [
                [
                    'product_variant_id' => $this->tileVariant->id,
                    'unit_id' => $this->boxUnit->id,
                    'quantity_received' => 5,
                    'quantity_accepted' => 5,
                    'quantity_rejected' => 0,
                ],
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'unit_id' => $this->sqftUnit->id,
                    'quantity_received' => 2,
                    'quantity_accepted' => 2,
                    'quantity_rejected' => 0,
                    'slabs' => [
                        ['length' => 120, 'width' => 60, 'thickness' => 20, 'finish' => 'POLISHED', 'origin' => 'IMPORT'],
                        ['length' => 100, 'width' => 50, 'thickness' => 20, 'finish' => 'HONED', 'origin' => 'DOMESTIC'],
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/grn', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('goods_receipt_notes', [
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::DRAFT->value,
        ]);

        $this->assertDatabaseCount('goods_receipt_items', 2);
        $this->assertDatabaseCount('goods_receipt_item_slabs', 2);

        // Verify that no stock has been added to inventory
        $this->assertDatabaseCount('inventory_objects', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_grn_draft_update()
    {
        // 1. Create a draft GRN
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'supplier_id' => $this->supplier->id,
            'grn_number' => 'GRN-DRAFT-1',
            'received_date' => '2026-08-09',
            'status' => GoodsReceiptStatus::DRAFT->value,
        ]);

        $item = $grn->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->sqftUnit->id,
            'quantity_received' => 1,
            'quantity_accepted' => 1,
            'quantity_rejected' => 0,
        ]);

        $slab = $item->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 120,
            'width' => 60,
            'thickness' => 20,
        ]);

        // 2. Put updates
        $payload = [
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'supplier_id' => $this->supplier->id,
            'received_date' => '2026-08-09',
            'remarks' => 'Updated draft GRN',
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'unit_id' => $this->sqftUnit->id,
                    'quantity_received' => 1,
                    'quantity_accepted' => 1,
                    'quantity_rejected' => 0,
                    'slabs' => [
                        ['length' => 150, 'width' => 80, 'thickness' => 20, 'finish' => 'POLISHED', 'origin' => 'IMPORT'],
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/grn/{$grn->id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('goods_receipt_item_slabs', [
            'length' => 150.00,
            'width' => 80.00,
        ]);
        $this->assertDatabaseMissing('goods_receipt_item_slabs', [
            'length' => 120.00,
        ]);
    }

    public function test_grn_approval_creates_inventory_and_movements()
    {
        Event::fake([InventoryReceived::class]);

        // 1. Create a draft GRN
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'supplier_id' => $this->supplier->id,
            'grn_number' => 'GRN-DRAFT-2',
            'received_date' => '2026-08-09',
            'status' => GoodsReceiptStatus::DRAFT->value,
        ]);

        // Add Tile Item: 2 Boxes
        $tileItem = $grn->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'unit_id' => $this->boxUnit->id,
            'quantity_received' => 2.0000,
            'quantity_accepted' => 2.0000,
            'quantity_rejected' => 0.0000,
        ]);

        // Add Granite Item: 1 Slab of 120" x 60" (Area = 120 * 60 / 144 = 50 SQFT)
        $graniteItem = $grn->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->sqftUnit->id,
            'quantity_received' => 1.0000,
            'quantity_accepted' => 1.0000,
            'quantity_rejected' => 0.0000,
        ]);

        $graniteItem->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 120.00,
            'width' => 60.00,
            'thickness' => 20.00,
            'finish' => 'POLISHED',
            'origin' => 'IMPORT'
        ]);

        // 2. Approve GRN
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn->id}/approve");

        $response->assertStatus(200);
        $this->assertEquals(GoodsReceiptStatus::LOCKED->value, $grn->fresh()->status);

        // 3. Verify Tiles inventory: converted Box -> PCS. 2 Boxes * 10 multiplier = 20 Pcs.
        // Area: 2 Boxes * 15.5 SQFT multiplier = 31 SQFT.
        $this->assertDatabaseHas('inventory_objects', [
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'quantity' => 20.0000,
            'area' => 31.0000,
            'status' => 'AVAILABLE'
        ]);

        // 4. Verify Granite inventory: 1 object with qty = 1, area = 50.00
        $this->assertDatabaseHas('inventory_objects', [
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->graniteVariant->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'quantity' => 1.0000,
            'area' => 50.0000,
            'status' => 'AVAILABLE'
        ]);

        $this->assertDatabaseHas('granite_slab_details', [
            'length' => 120.00,
            'width' => 60.00,
        ]);

        // 5. Verify movements
        $this->assertDatabaseHas('inventory_movements', [
            'organization_id' => $this->org->id,
            'movement_type' => 'PURCHASE',
            'reference_type' => 'GoodsReceiptNote',
            'reference_id' => $grn->id,
            'quantity_delta' => 20.0000,
            'area_delta' => 31.0000,
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'organization_id' => $this->org->id,
            'movement_type' => 'PURCHASE',
            'reference_type' => 'GoodsReceiptNote',
            'reference_id' => $grn->id,
            'quantity_delta' => 1.0000,
            'area_delta' => 50.0000,
        ]);

        Event::assertDispatched(InventoryReceived::class, function ($event) use ($grn) {
            return $event->grn->id === $grn->id;
        });
    }

    public function test_grn_duplicate_approval_prevention()
    {
        // 1. Create APPROVED GRN
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::APPROVED->value,
            'grn_number' => 'GRN-APPROVED-1',
            'received_date' => '2026-08-09'
        ]);

        // 2. Attempt approving again
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn->id}/approve");

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
    }

    public function test_grn_validation_rules()
    {
        // Slab count mismatch validation: received 2 slabs, but only 1 supplied.
        $payload = [
            'warehouse_id' => $this->warehouse->id,
            'supplier_id' => $this->supplier->id,
            'received_date' => '2026-08-09',
            'items' => [
                [
                    'product_variant_id' => $this->graniteVariant->id,
                    'unit_id' => $this->sqftUnit->id,
                    'quantity_received' => 2,
                    'quantity_accepted' => 2,
                    'quantity_rejected' => 0,
                    'slabs' => [
                        ['length' => 120, 'width' => 60]
                    ]
                ]
            ]
        ];

        // 1. Creation step will save the draft successfully (draft doesn't block slab count mismatch immediately, but approval service does).
        // Let's assert approval service blocks it.
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::DRAFT->value,
            'grn_number' => 'GRN-DRAFT-3',
            'received_date' => '2026-08-09'
        ]);
        $item = $grn->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->sqftUnit->id,
            'quantity_received' => 2,
            'quantity_accepted' => 2,
            'quantity_rejected' => 0,
        ]);
        $item->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 120, 'width' => 60
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn->id}/approve");

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
        $this->assertStringContainsString('Slab count', $response->json('message'));
    }

    public function test_grn_tenant_isolation()
    {
        // 1. Create Organization B and user B
        $orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'Operator B',
            'email' => 'operator@orgb.com',
            'password' => bcrypt('password')
        ]);

        // 2. Create GRN in Org A
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::DRAFT->value,
            'grn_number' => 'GRN-ORG-A',
            'received_date' => '2026-08-09'
        ]);

        // 3. User B tries to view GRN A
        $response = $this->actingAs($userB, 'sanctum')
            ->getJson("/api/grn/{$grn->id}");

        $response->assertStatus(404); // Scoped global query doesn't find the record
    }

    public function test_grn_approval_creates_accounting_journal_entries()
    {
        // 1. Create a DRAFT GRN with standard and slab items
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'supplier_id' => $this->supplier->id,
            'status' => GoodsReceiptStatus::DRAFT->value,
            'grn_number' => 'GRN-ACT-1',
            'received_date' => '2026-08-09'
        ]);

        $this->tileVariant->update(['cost_price' => 120.00]);

        // Bulk item: 2 Boxes (Cost: 120.00 each -> Total Bulk = 240.00)
        $bulkItem = $grn->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'unit_id' => $this->boxUnit->id,
            'quantity_received' => 2.0000,
            'quantity_accepted' => 2.0000,
            'quantity_rejected' => 0.0000,
        ]);

        $this->graniteVariant->update(['cost_price' => 250.00]);
        
        $slabItem = $grn->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->sqftUnit->id,
            'quantity_received' => 1.0000,
            'quantity_accepted' => 1.0000,
            'quantity_rejected' => 0.0000,
        ]);

        $slabItem->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 120.00,
            'width' => 60.00,
            'thickness' => 20.00,
            'finish' => 'POLISHED',
            'origin' => 'IMPORT'
        ]);

        // Total calculated value = (2 * 120.00) + (50 * 250.00) = 240.00 + 12500.00 = 12740.00.

        // 2. Approve via API
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn->id}/approve");

        $response->assertStatus(200);

        // Assert GRN status is LOCKED
        $this->assertEquals(GoodsReceiptStatus::LOCKED->value, $grn->fresh()->status);

        // 3. Verify Journal and JournalEntry records
        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'reference_type' => 'GoodsReceiptNote',
            'reference_id' => $grn->id,
        ]);

        $journal = \App\Domains\Accounting\Models\Journal::where('reference_type', 'GoodsReceiptNote')
            ->where('reference_id', $grn->id)
            ->first();

        $this->assertNotNull($journal);

        // Check entries: Debit Inventory Asset, Credit GRNI
        $entries = $journal->entries;
        $this->assertCount(2, $entries);

        $debitEntry = $entries->where('entry_type', 'DEBIT')->first();
        $creditEntry = $entries->where('entry_type', 'CREDIT')->first();

        $this->assertNotNull($debitEntry);
        $this->assertNotNull($creditEntry);

        $this->assertEquals(12740.0000, (float) $debitEntry->amount);
        $this->assertEquals(12740.0000, (float) $creditEntry->amount);

        // Check accounts
        $inventoryAccount = \App\Domains\Accounting\Models\Account::find($debitEntry->account_id);
        $grniAccount = \App\Domains\Accounting\Models\Account::find($creditEntry->account_id);

        $this->assertStringContainsString('Inventory', $inventoryAccount->name);
        $this->assertStringContainsString('Goods Received Not Invoiced', $grniAccount->name);
    }

    public function test_grn_slab_rules_validation()
    {
        // 1. Bulk item must not contain slabs
        $grn1 = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::DRAFT->value,
            'grn_number' => 'GRN-VAL-ERR-1',
            'received_date' => '2026-08-09'
        ]);

        $bulkItem = $grn1->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->tileVariant->id,
            'unit_id' => $this->boxUnit->id,
            'quantity_received' => 2.0000,
            'quantity_accepted' => 2.0000,
            'quantity_rejected' => 0.0000,
        ]);

        // Add slabs to standard variant (illegal)
        $bulkItem->slabs()->create([
            'organization_id' => $this->org->id,
            'length' => 120, 'width' => 60
        ]);

        $response1 = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn1->id}/approve");

        $response1->assertStatus(422);
        $this->assertStringContainsString('Slabs data must not be provided', $response1->json('message'));

        // 2. Slab item must have slabs
        $grn2 = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::DRAFT->value,
            'grn_number' => 'GRN-VAL-ERR-2',
            'received_date' => '2026-08-09'
        ]);

        $grn2->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->graniteVariant->id,
            'unit_id' => $this->sqftUnit->id,
            'quantity_received' => 1.0000,
            'quantity_accepted' => 1.0000,
            'quantity_rejected' => 0.0000,
        ]);

        $response2 = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn2->id}/approve");

        $response2->assertStatus(422);
        $this->assertStringContainsString('Granite slabs are required', $response2->json('message'));
    }

    public function test_grn_duplicate_approval_prevention_on_locked()
    {
        $grn = GoodsReceiptNote::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => GoodsReceiptStatus::LOCKED->value,
            'grn_number' => 'GRN-LOCKED-TEST-1',
            'received_date' => '2026-08-09'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/grn/{$grn->id}/approve");

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
    }
}
