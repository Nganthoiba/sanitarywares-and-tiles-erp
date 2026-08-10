<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Supplier;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\PurchaseOrderItem;
use App\Domains\Purchase\Models\PurchaseRequisition;
use App\Domains\Purchase\Models\PurchaseRequisitionItem;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\GoodsReceiptItem;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use App\Domains\Purchase\Services\PurchaseOrderService;
use App\Domains\Purchase\Services\GRNService;
use App\Domains\Workflow\Models\WorkflowDefinition;
use App\Domains\Workflow\Models\WorkflowStep;
use App\Domains\Workflow\Models\WorkflowTransition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;

class PurchaseOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Branch $branch;
    protected Supplier $supplier;
    protected Unit $pcsUnit;
    protected ProductVariant $variant;
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

        $this->pcsUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Piece',
            'symbol' => 'PCS',
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
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles',
        ]);

        $family = \App\Domains\Product\Models\ProductFamily::create([
            'organization_id' => $this->org->id,
            'name' => 'General Material',
            'code' => 'GEN-MAT',
            'category_id' => $category->id,
            'tax_profile_id' => $tax->id,
        ]);

        $this->variant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $family->id,
            'tax_profile_id' => $tax->id,
            'sku' => 'SKU-TEST-01',
            'name' => 'Test Tile Standard',
            'inventory_behavior' => 'BULK',
            'cost_price' => 100.0000,
            'sale_price' => 150.0000,
            'base_unit_id' => $this->pcsUnit->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'is_active' => true,
        ]);

        $this->poService = app(PurchaseOrderService::class);
        $this->grnService = app(GRNService::class);
    }

    /**
     * Test direct PO creation (Draft).
     */
    public function test_can_create_direct_purchase_order_in_draft(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'expected_delivery_date' => now()->addDays(7)->toDateString(),
            'reference_number' => 'REF-123',
            'payment_terms' => 'COD',
            'delivery_terms' => 'FOB',
            'remarks' => 'Direct Draft test',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 50,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00,
                    'discount_amount' => 10.00,
                    'tax_rate' => 18.0
                ]
            ]
        ], $this->org->id);

        $this->assertDatabaseHas('purchase_orders', [
            'id' => $po->id,
            'po_number' => $po->po_number,
            'status' => 'DRAFT',
            'discount_amount' => '10.0000',
            'total_amount' => '5888.2000',
        ]);

        $this->assertCount(1, $po->items);
        $this->assertEquals(50, $po->items->first()->quantity);
    }

    /**
     * Test PO creation from approved Requisition.
     */
    public function test_can_convert_requisition_to_purchase_order(): void
    {
        $this->actingAs($this->user);

        // 1. Create Requisition in APPROVED status
        $pr = PurchaseRequisition::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'pr_number' => 'PR-TEST-001',
            'requested_by' => $this->user->id,
            'status' => 'APPROVED'
        ]);

        $prItem = $pr->items()->create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 100,
            'unit_id' => $this->pcsUnit->id
        ]);

        // 2. Convert to PO
        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'purchase_requisition_id' => $pr->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 100,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        $pr->refresh();

        $this->assertEquals('ORDERED', $pr->status);
        $this->assertEquals($pr->id, $po->purchase_requisition_id);

        // Try converting again should throw an exception
        $this->expectException(Exception::class);
        $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'purchase_requisition_id' => $pr->id,
            'po_date' => now()->toDateString(),
            'items' => []
        ], $this->org->id);
    }

    /**
     * Test submit with auto approval if no workflow exists.
     */
    public function test_po_auto_approves_if_no_workflow_definition_configured(): void
    {
        $this->actingAs($this->user);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);

        $this->assertEquals('APPROVED', $po->status);
    }

    /**
     * Test workflow runner integration if definition exists.
     */
    public function test_po_integrates_with_bpm_workflow_definition_if_exists(): void
    {
        $this->actingAs($this->user);

        // 1. Create a workflow definition
        $def = WorkflowDefinition::create([
            'organization_id' => $this->org->id,
            'code' => 'PO-APPROVAL-FLOW',
            'name' => 'PO Approval Flow',
            'module' => 'Purchase',
            'is_active' => true
        ]);

        $start = WorkflowStep::create(['workflow_definition_id' => $def->id, 'name' => 'Start', 'step_type' => 'START']);
        $approval = WorkflowStep::create(['workflow_definition_id' => $def->id, 'name' => 'Approval Step', 'step_type' => 'APPROVAL', 'workflow_action' => 'ApprovePurchaseAction']);
        $end = WorkflowStep::create(['workflow_definition_id' => $def->id, 'name' => 'End', 'step_type' => 'END']);

        WorkflowTransition::create(['workflow_definition_id' => $def->id, 'from_step_id' => $start->id, 'to_step_id' => $approval->id, 'name' => 'Init']);
        WorkflowTransition::create(['workflow_definition_id' => $def->id, 'from_step_id' => $approval->id, 'to_step_id' => $end->id, 'name' => 'Approve']);

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);

        // Since definition is active, PO remains in SUBMITTED status and a workflow instance is active
        $this->assertEquals('SUBMITTED', $po->status);

        $instance = \App\Domains\Workflow\Models\WorkflowInstance::where('reference_id', $po->id)->first();
        $this->assertNotNull($instance);
        $this->assertEquals('WAITING', $instance->status);

        // Approve workflow step
        app(\App\Domains\Workflow\Services\WorkflowRunner::class)->approve($instance, 'Manager A', 'Approved PO');

        $po->refresh();
        $this->assertEquals('APPROVED', $po->status);
    }

    /**
     * Test over-receipt policies.
     */
    public function test_over_receipt_strict_policy_prevents_excess_goods_receipt(): void
    {
        $this->actingAs($this->user);

        // Organization policy is STRICT by default
        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->send($po->id);

        // Create warehouse
        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Main WH',
            'code' => 'WH-M',
            'is_active' => true
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc B',
            'location_type' => 'ZONE',
            'code' => 'LOC-B'
        ]);

        // Attempting to receive 15 items (exceeds ordered quantity 10)
        $grn = $this->grnService->createDraft([
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'purchase_order_id' => $po->id,
            'supplier_id' => $this->supplier->id,
            'items' => [
                [
                    'purchase_order_item_id' => $po->items->first()->id,
                    'product_variant_id' => $this->variant->id,
                    'unit_id' => $this->pcsUnit->id,
                    'quantity_received' => 15,
                    'quantity_accepted' => 15
                ]
            ]
        ]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/Over-receipt not allowed/');
        $this->grnService->approveGRN($grn->id);
    }

    /**
     * Test over-receipt ALLOW_WITH_APPROVAL policy.
     */
    public function test_over_receipt_allowed_with_approval_requires_correct_remarks(): void
    {
        $this->actingAs($this->user);

        // Change policy to ALLOW_WITH_APPROVAL
        $this->org->settings = ['over_receipt_policy' => 'ALLOW_WITH_APPROVAL'];
        $this->org->save();

        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        $po = $this->poService->submit($po->id);
        $po = $this->poService->send($po->id);

        $warehouse = \App\Domains\Master\Models\Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Main WH',
            'code' => 'WH-M',
            'is_active' => true
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Loc B',
            'location_type' => 'ZONE',
            'code' => 'LOC-B'
        ]);

        // Attempting to receive 12 items without remarks validation triggers exception
        $grn = $this->grnService->createDraft([
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'purchase_order_id' => $po->id,
            'supplier_id' => $this->supplier->id,
            'remarks' => 'Receive excess items',
            'items' => [
                [
                    'purchase_order_item_id' => $po->items->first()->id,
                    'product_variant_id' => $this->variant->id,
                    'unit_id' => $this->pcsUnit->id,
                    'quantity_received' => 12,
                    'quantity_accepted' => 12
                ]
            ]
        ]);

        try {
            $this->grnService->approveGRN($grn->id);
            $this->fail("Expected exception for missing over-receipt approval");
        } catch (Exception $e) {
            $this->assertStringContainsString("Over-receipt requires authorization", $e->getMessage());
        }

        // Updating remarks to include authorization string allows it
        $grn = $this->grnService->updateDraft($grn->id, [
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'purchase_order_id' => $po->id,
            'supplier_id' => $this->supplier->id,
            'remarks' => 'Approved over-receipt for testing',
            'items' => [
                [
                    'purchase_order_item_id' => $po->items->first()->id,
                    'product_variant_id' => $this->variant->id,
                    'unit_id' => $this->pcsUnit->id,
                    'quantity_received' => 12,
                    'quantity_accepted' => 12
                ]
            ]
        ]);

        $grn = $this->grnService->approveGRN($grn->id);
        $this->assertEquals(GoodsReceiptStatus::LOCKED->value, $grn->status);

        $poItem = PurchaseOrderItem::find($po->items->first()->id);
        $this->assertEquals(12, $poItem->received_quantity);

        $po->refresh();
        $this->assertEquals('FULLY_RECEIVED', $po->status);
    }

    /**
     * Test multi-tenant isolation.
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

        // Raise PO as organization Apex
        $po = $this->poService->createPO([
            'branch_id' => $this->branch->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => now()->toDateString(),
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 5,
                    'unit_id' => $this->pcsUnit->id,
                    'unit_price' => 100.00
                ]
            ]
        ], $this->org->id);

        // Switch user context to Other Tenant
        $this->actingAs($otherUser);

        // Trying to view PO should return ModelNotFoundException
        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        PurchaseOrder::findOrFail($po->id);
    }
}
