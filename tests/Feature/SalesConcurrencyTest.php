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
use Illuminate\Support\Facades\DB;
use Exception;

class SalesConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected Customer $customer;
    protected Unit $boxUnit;
    protected Product $product;
    protected SalesService $salesService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->salesService = app(SalesService::class);

        $this->org = Organization::create([
            'name' => 'Concurrency Tile Enterprise',
            'code' => 'ORG-CONC-01',
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
            'name' => 'Central Storage',
            'code' => 'WH-01',
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Walk-in Customer A',
            'code' => 'CUST-001',
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
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'name' => 'Concurrency Hardened Tile',
            'sku' => 'TILE-CONC-01',
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

        // Put exactly 10 Boxes in stock
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->product->id,
            'object_code' => 'INV-CONC-100',
            'quantity' => 10.0,
            'area' => 0.0,
            'status' => 'AVAILABLE',
        ]);
    }

    /** @test */
    public function it_prevents_over_allocation_when_competing_sales_requests_occur()
    {
        $orgId = $this->org->id;

        // First sale buys 8 boxes (leaving 2 available)
        $invoice1 = $this->salesService->createDirectSale([
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'CASH',
            'paid_amount' => 6400.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 8.0,
                    'unit_price' => 800.00,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $orgId);

        $this->assertNotNull($invoice1->id);

        // Second sale attempts to buy 7 boxes (only 2 remain), must fail due to lock & fresh availability check
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/Insufficient stock/');

        $this->salesService->createDirectSale([
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'CASH',
            'paid_amount' => 5600.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 7.0,
                    'unit_price' => 800.00,
                    'unit_id' => $this->boxUnit->id,
                ],
            ],
        ], $orgId);
    }
}
