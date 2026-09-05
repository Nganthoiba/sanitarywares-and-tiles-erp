<?php

namespace Tests\Feature;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Sales\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesDirectBillingTest extends TestCase
{
    use RefreshDatabase;

    protected $organization;
    protected $warehouse;
    protected $customer;
    protected $product;
    protected $pcsUnit;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->organization = Organization::create([
            'name' => 'Manipur Sanitary & Tiles Store',
            'code' => 'ORG-MSTS-01',
            'state' => 'Manipur'
        ]);

        $branch = Branch::create([
            'organization_id' => $this->organization->id,
            'name' => 'Imphal Main Branch',
            'code' => 'BR-IMP-01',
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->organization->id,
            'branch_id' => $branch->id,
            'name' => 'Main Depot Warehouse',
            'code' => 'WH-DEPOT-01',
            'type' => 'MAIN',
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'organization_id' => $this->organization->id,
            'name' => 'Ramesh Kumar Traders',
            'code' => 'CUST-0001',
            'phone' => '9876543210',
            'state' => 'Manipur',
            'city' => 'Imphal',
            'is_active' => true,
        ]);

        $this->pcsUnit = Unit::create(['name' => 'Piece', 'symbol' => 'PCS', 'type' => 'QUANTITY']);

        $taxProfile = TaxProfile::create([
            'organization_id' => $this->organization->id,
            'name' => 'GST 18%',
            'code' => 'GST18',
            'tax_rate' => 18.00,
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'organization_id' => $this->organization->id,
            'name' => 'Vitrified Premium Floor Tile 800x800',
            'sku' => 'TILE-VIT-800',
            'inventory_behavior' => 'STANDARD',
            'base_unit_id' => $this->pcsUnit->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $taxProfile->id,
            'is_active' => true,
        ]);

        // Create available stock in warehouse
        InventoryObject::create([
            'organization_id' => $this->organization->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'BULK-INIT-001',
            'quantity' => 100.0000,
            'area' => 0.0000,
            'batch_number' => 'BATCH-2026-001',
            'status' => 'AVAILABLE',
        ]);

        // Setup commercial pricing
        \App\Domains\Product\Models\OrganizationProductPricing::create([
            'organization_id' => $this->organization->id,
            'product_variant_id' => $this->product->id,
            'cost_price' => 1800.00,
            'selling_price' => 2400.00,
            'price_basis' => 'BOX',
            'pieces_per_box' => 4,
            'is_current' => true,
        ]);

        // Setup user with permissions
        $role = \App\Domains\Security\Models\Role::create([
            'organization_id' => $this->organization->id,
            'name' => 'Sales Manager',
            'slug' => 'sales-manager',
            'is_custom' => false
        ]);

        $this->user = User::create([
            'organization_id' => $this->organization->id,
            'name' => 'Counter Sales Executive',
            'email' => 'sales@manipurtiles.com',
            'password' => bcrypt('password123'),
            'default_role_id' => $role->id
        ]);
        $this->user->roles()->attach($role->id);
    }

    public function test_direct_counter_sale_posts_invoice_deducts_stock_and_posts_gl(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'invoice_date' => '2026-09-05',
            'payment_method' => 'CASH',
            'paid_amount' => 1180.00,
            'notes' => 'Counter Cash Sale Test',
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'unit_id' => $this->pcsUnit->id,
                    'price_basis' => 'PCS',
                    'quantity' => 10,
                    'unit_price' => 100.00,
                    'discount_amount' => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/sales/direct', $payload);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'invoice' => [
                'id',
                'invoice_number',
                'subtotal',
                'tax_amount',
                'total_amount',
                'payment_status',
                'items'
            ]
        ]);

        // 1. Verify Invoice & Item Creation
        $invoiceId = $response->json('invoice.id');
        $invoice = Invoice::with('items')->find($invoiceId);
        $this->assertNotNull($invoice);
        $this->assertEquals(1000.00, (float) $invoice->subtotal);
        $this->assertEquals(180.00, (float) $invoice->tax_amount);
        $this->assertEquals(1180.00, (float) $invoice->total_amount);
        $this->assertEquals('PAID', $invoice->payment_status);

        $this->assertCount(1, $invoice->items);
        $item = $invoice->items->first();
        $this->assertEquals('Vitrified Premium Floor Tile 800x800', $item->product_name_snapshot);
        $this->assertEquals('TILE-VIT-800', $item->sku_snapshot);
        $this->assertEquals(90.00, (float) $item->cgst_amount);
        $this->assertEquals(90.00, (float) $item->sgst_amount);

        // 2. Verify Stock Deduction
        $inventoryObject = InventoryObject::where('product_variant_id', $this->product->id)->first();
        $this->assertEquals(90.0000, (float) $inventoryObject->quantity); // 100 - 10 = 90

        // 3. Verify GL Journals
        $journals = \App\Domains\Accounting\Models\Journal::where('organization_id', $this->organization->id)->get();
        $this->assertGreaterThanOrEqual(1, $journals->count());
    }

    public function test_sales_form_data_returns_available_stock_and_products(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/sales/form-data');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'customers',
            'warehouses',
            'units',
            'organization',
            'products'
        ]);

        $products = $response->json('products');
        $this->assertNotEmpty($products);
        $this->assertEquals('TILE-VIT-800', $products[0]['sku']);
        $this->assertEquals(2400.00, $products[0]['current_pricing']['selling_price']);
        $this->assertEquals('BOX', $products[0]['current_pricing']['price_basis']);
    }
}
