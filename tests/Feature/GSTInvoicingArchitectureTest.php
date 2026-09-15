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
use Illuminate\Foundation\Testing\RefreshDatabase;

class GSTInvoicingArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected Unit $boxUnit;
    protected TaxProfile $tax18;
    protected Product $product;
    protected SalesService $salesService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->salesService = app(SalesService::class);

        $this->org = Organization::create([
            'name' => 'Manipur Tile Enterprise',
            'code' => 'ORG-GST-01',
            'state' => 'Manipur',
            'gstin' => '14AAAAA0000A1Z5',
            'is_active' => true,
        ]);

        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Imphal Showroom',
            'code' => 'BR-01',
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'name' => 'Central Yard',
            'code' => 'WH-01',
            'is_active' => true,
        ]);

        $this->boxUnit = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'category' => 'COUNT',
            'is_base' => true,
        ]);

        $this->tax18 = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'hsn_code' => '69072100',
            'rate' => 18.00,
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'name' => 'Premium Vitrified Tile 60x60',
            'sku' => 'TILE-6060-VIT',
            'base_unit_id' => $this->boxUnit->id,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->tax18->id,
            'inventory_behavior' => 'STANDARD',
            'is_active' => true,
        ]);

        OrganizationProductPricing::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'cost_price' => 500.00,
            'selling_price' => 1000.00,
            'price_basis' => 'BOX',
            'is_current' => true,
        ]);

        InventoryObject::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->product->id,
            'object_code' => 'INV-GST-100',
            'quantity' => 100.0,
            'area' => 0.0,
            'status' => 'AVAILABLE',
        ]);
    }

    /** @test */
    public function it_automatically_classifies_intra_state_supply_and_calculates_cgst_sgst()
    {
        $intraCustomer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Local Imphal Builder',
            'code' => 'CUST-LOC-01',
            'state' => 'Manipur',
            'gstin' => '14BBBBA1111B1Z2',
            'gst_registration_type' => 'REGISTERED_REGULAR',
            'is_active' => true,
        ]);

        $invoice = $this->salesService->createDirectSale([
            'customer_id' => $intraCustomer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'CASH',
            'paid_amount' => 1000.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 1.0,
                    'unit_price' => 1000.00,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $this->org->id);

        $this->assertEquals('INTRA_STATE', $invoice->supply_type);
        $this->assertEquals('Manipur', $invoice->place_of_supply_state);
        $this->assertEquals('14AAAAA0000A1Z5', $invoice->supplier_gstin);
        $this->assertEquals('14BBBBA1111B1Z2', $invoice->customer_gstin);
        $this->assertEquals('REGISTERED_REGULAR', $invoice->gst_registration_type);
        $this->assertGreaterThan(0, $invoice->cgst_amount);
        $this->assertGreaterThan(0, $invoice->sgst_amount);
        $this->assertEquals(0.0, (float) $invoice->igst_amount);

        $item = $invoice->items->first();
        $this->assertEquals('69072100', $item->hsn_sac_code);
    }

    /** @test */
    public function it_automatically_classifies_inter_state_supply_and_calculates_igst()
    {
        $interCustomer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Assam Wholesale Dealer',
            'code' => 'CUST-ASM-01',
            'state' => 'Assam',
            'gstin' => '18CCCCA2222C1Z3',
            'gst_registration_type' => 'REGISTERED_REGULAR',
            'is_active' => true,
        ]);

        $invoice = $this->salesService->createDirectSale([
            'customer_id' => $interCustomer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'CASH',
            'paid_amount' => 1000.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 1.0,
                    'unit_price' => 1000.00,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $this->org->id);

        $this->assertEquals('INTER_STATE', $invoice->supply_type);
        $this->assertEquals('Assam', $invoice->place_of_supply_state);
        $this->assertEquals(0.0, (float) $invoice->cgst_amount);
        $this->assertEquals(0.0, (float) $invoice->sgst_amount);
        $this->assertGreaterThan(0, (float) $invoice->igst_amount);
    }

    /** @test */
    public function it_handles_tax_exclusive_pricing_and_exempt_items()
    {
        $customer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Walk-in Retail Buyer',
            'code' => 'CUST-RET-01',
            'state' => 'Manipur',
            'is_active' => true,
        ]);

        // Test Tax Exclusive (₹1000 base + 18% GST = ₹1180 total)
        $invoice = $this->salesService->createDirectSale([
            'customer_id' => $customer->id,
            'warehouse_id' => $this->warehouse->id,
            'is_tax_inclusive' => false,
            'payment_method' => 'CASH',
            'paid_amount' => 1180.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 1.0,
                    'unit_price' => 1000.00,
                    'is_tax_inclusive' => false,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $this->org->id);

        $this->assertEquals(1000.00, (float) $invoice->taxable_amount);
        $this->assertEquals(180.00, (float) $invoice->tax_amount);
        $this->assertEquals(1180.00, (float) $invoice->total_amount);

        // Test Exempt Tax Category
        $exemptInvoice = $this->salesService->createDirectSale([
            'customer_id' => $customer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'CASH',
            'paid_amount' => 1000.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 1.0,
                    'unit_price' => 1000.00,
                    'tax_category' => 'EXEMPT',
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $this->org->id);

        $this->assertEquals(0.0, (float) $exemptInvoice->tax_amount);
        $this->assertEquals('EXEMPT', $exemptInvoice->items->first()->tax_category);
    }

    /** @test */
    public function it_provides_authoritative_backend_tax_preview_endpoint()
    {
        $user = User::factory()->create([
            'organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/sales/calculate-preview', [
                'is_tax_inclusive' => true,
                'items' => [
                    [
                        'product_variant_id' => $this->product->id,
                        'quantity' => 2,
                        'unit_price' => 1000.00,
                        'discount_amount' => 0.0,
                    ]
                ]
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'subtotal', 'discount_amount', 'taxable_amount', 'tax_amount',
                'cgst_amount', 'sgst_amount', 'igst_amount', 'grand_total',
                'supply_type', 'items'
            ]);

        $this->assertEquals(2000.00, $response->json('subtotal'));
        $this->assertEquals(2000.00, $response->json('grand_total'));
        $this->assertEquals('INTRA_STATE', $response->json('supply_type'));
    }
}
