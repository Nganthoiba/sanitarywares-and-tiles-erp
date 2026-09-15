<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\OrganizationProductPricing;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Sales\Services\SalesService;
use App\Domains\Accounting\Services\PostingService;
use App\Domains\Accounting\Models\JournalEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TwoTrackSalesWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected Customer $customer;
    protected Unit $boxUnit;
    protected Product $product;
    protected User $user;
    protected SalesService $salesService;
    protected PostingService $postingService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->salesService = app(SalesService::class);
        $this->postingService = app(PostingService::class);

        // Setup master entities
        $this->org = Organization::create([
            'name' => 'Test Tile & Sanitary Corp',
            'code' => 'ORG-TEST-01',
            'state' => 'Manipur',
            'is_active' => true,
        ]);

        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Showroom',
            'code' => 'BR-01',
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Main Storage Yard',
            'code' => 'WH-01',
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Imphal Builders & Contractors',
            'code' => 'CUST-TEST-01',
            'phone' => '9876543210',
            'state' => 'Manipur',
            'is_active' => true,
        ]);

        $this->boxUnit = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'category' => 'COUNT',
            'is_base' => true,
        ]);

        $taxProfile = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'rate' => 18.00,
            'hsn_sac_code' => '69072100',
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'name' => 'Royal Marble Finish Vitrified Tile 600x1200mm',
            'sku' => 'TILE-ROYAL-601200',
            'base_unit_id' => $this->boxUnit->id,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $taxProfile->id,
            'inventory_behavior' => 'STANDARD',
            'is_active' => true,
        ]);

        OrganizationProductPricing::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'cost_price' => 500.00,
            'selling_price' => 800.00,
            'price_basis' => 'BOX',
            'is_current' => true,
        ]);

        // Add 100 boxes into warehouse stock
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->product->id,
            'object_code' => 'INV-BOX-001',
            'quantity' => 100.0,
            'area' => 0.0,
            'status' => 'AVAILABLE',
        ]);

        $this->user = User::factory()->create([
            'organization_id' => $this->org->id,
        ]);
    }

    /** @test */
    public function it_executes_track_1_full_multi_step_sales_workflow()
    {
        $orgId = $this->org->id;

        // 1. Create Quotation
        $quotation = $this->salesService->createQuotation([
            'customer_id' => $this->customer->id,
            'branch_id' => $this->branch->id,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 10.0,
                    'unit_price' => 800.00,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $orgId);

        $this->assertNotNull($quotation->id);
        $this->assertEquals('DRAFT', $quotation->status);

        // 2. Convert Quotation to Sales Order
        $salesOrder = $this->salesService->convertQuotationToSalesOrder($quotation->id, $orgId);
        $this->assertNotNull($salesOrder->id);
        $this->assertEquals('CONFIRMED', $salesOrder->status);
        $this->assertEquals('ACCEPTED', $quotation->fresh()->status);

        // 3. Reserve Stock for Sales Order
        $reservations = $this->salesService->reserveStockForSalesOrder($salesOrder->id, $this->warehouse->id, $orgId);
        $this->assertCount(1, $reservations);
        $this->assertEquals('RESERVED', $salesOrder->fresh()->status);

        // 4. Dispatch Goods
        $dispatch = $this->salesService->createDispatchFromSalesOrder([
            'sales_order_id' => $salesOrder->id,
            'warehouse_id' => $this->warehouse->id,
        ], $orgId);

        $this->assertNotNull($dispatch->id);
        $this->assertEquals('DISPATCHED', $salesOrder->fresh()->status);
        $this->assertEquals(90.0, InventoryObject::where('warehouse_id', $this->warehouse->id)->first()->quantity);

        // 5. Generate Invoice & Post Accounting
        $invoice = $this->salesService->createInvoiceFromDispatch($dispatch->id, [
            'paid_amount' => 8000.00,
            'payment_method' => 'BANK',
        ], $orgId);

        $this->assertNotNull($invoice->id);
        $this->assertEquals('PAID', $invoice->payment_status);

        // Verify Journal Postings (Sales Revenue, Bank Receipt, COGS)
        $this->assertDatabaseHas('journals', [
            'organization_id' => $orgId,
            'reference_type' => 'Invoice',
        ]);
        $this->assertDatabaseHas('journals', [
            'organization_id' => $orgId,
            'reference_type' => 'InvoiceCOGS',
        ]);

        // 6. Execute Sales Return
        $salesReturn = $this->salesService->createSalesReturn([
            'invoice_id' => $invoice->id,
            'items' => [
                [
                    'invoice_item_id' => $invoice->items->first()->id,
                    'quantity' => 2.0,
                ],
            ],
        ], $orgId);

        $this->assertNotNull($salesReturn->id);
        $this->assertEquals('APPROVED', $salesReturn->status);
    }

    /** @test */
    public function it_executes_track_2_direct_counter_sale_workflow()
    {
        $orgId = $this->org->id;

        $invoice = $this->salesService->createDirectSale([
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'CASH',
            'paid_amount' => 4000.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 5.0,
                    'unit_price' => 800.00,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $orgId);

        $this->assertNotNull($invoice->id);
        $this->assertTrue((bool) $invoice->is_direct_sale);
        $this->assertEquals('PAID', $invoice->payment_status);
        $this->assertEquals(95.0, InventoryObject::where('warehouse_id', $this->warehouse->id)->first()->quantity);
    }
}
