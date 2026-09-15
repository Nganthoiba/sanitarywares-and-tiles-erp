<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Sales\Models\SalesOrder;
use App\Domains\Sales\Models\Invoice;
use App\Domains\Sales\Models\InvoiceItem;
use App\Domains\Reporting\Queries\SalesReportQuery;
use App\Domains\Reporting\Services\SalesReportService;
use App\Domains\Reporting\Models\ReportAuditLog;

class SalesReportIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Branch $branch1;
    protected Branch $branch2;
    protected Customer $customer;
    protected Category $category1;
    protected Category $category2;
    protected Product $product1;
    protected Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create(['code' => 'TEST-ORG-2', 'name' => 'Report Test Sanitaryware Org']);
        app(\App\Shared\Context\TenantContext::class)->setOrganization($this->org);

        $this->branch1 = Branch::create([
            'organization_id' => $this->org->id,
            'code' => 'BR-01',
            'name' => 'North Branch'
        ]);

        $this->branch2 = Branch::create([
            'organization_id' => $this->org->id,
            'code' => 'BR-02',
            'name' => 'South Branch'
        ]);

        $this->customer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Acme Buildcon',
            'code' => 'CUST-001',
            'customer_group' => 'RETAIL'
        ]);

        $this->category1 = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Sanitaryware',
            'slug' => 'sanitaryware'
        ]);

        $this->category2 = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Glazed Vitrified Tiles',
            'slug' => 'glazed-vitrified-tiles'
        ]);

        $unit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Piece',
            'symbol' => 'PCS',
            'type' => 'PIECE'
        ]);

        $gst18 = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'hsn_code' => '6907',
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'igst_rate' => 18
        ]);

        $this->product1 = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category1->id,
            'purchase_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'name' => 'One Piece Water Closet',
            'sku' => 'SAN-OP-01',
            'inventory_behavior' => 'BULK',
            'tax_profile_id' => $gst18->id
        ]);

        $this->product2 = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category2->id,
            'purchase_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'name' => '60x120 Marble Finish GVT Tile',
            'sku' => 'TILE-60120-MF',
            'inventory_behavior' => 'BULK',
            'tax_profile_id' => $gst18->id
        ]);

        // Create Sales Order for Branch 1
        $so1 = SalesOrder::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch1->id,
            'customer_id' => $this->customer->id,
            'so_number' => 'SO-1001',
            'so_date' => now()->toDateString(),
            'total_amount' => 15000.0,
            'status' => 'COMPLETED'
        ]);

        // Create Invoice linked to SO 1
        $inv1 = Invoice::create([
            'organization_id' => $this->org->id,
            'customer_id' => $this->customer->id,
            'sales_order_id' => $so1->id,
            'invoice_number' => 'INV-1001',
            'invoice_date' => now()->toDateString(),
            'subtotal' => 12711.86,
            'tax_amount' => 2288.14,
            'total_amount' => 15000.0,
            'status' => 'PAID'
        ]);

        InvoiceItem::create([
            'organization_id' => $this->org->id,
            'invoice_id' => $inv1->id,
            'product_variant_id' => $this->product1->id,
            'quantity' => 2.0,
            'unit_price' => 7500.0,
            'tax_amount' => 2288.14,
            'subtotal' => 15000.0
        ]);

        // Create Sales Order for Branch 2
        $so2 = SalesOrder::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch2->id,
            'customer_id' => $this->customer->id,
            'so_number' => 'SO-1002',
            'so_date' => now()->toDateString(),
            'total_amount' => 25000.0,
            'status' => 'COMPLETED'
        ]);

        // Create Invoice linked to SO 2
        $inv2 = Invoice::create([
            'organization_id' => $this->org->id,
            'customer_id' => $this->customer->id,
            'sales_order_id' => $so2->id,
            'invoice_number' => 'INV-1002',
            'invoice_date' => now()->toDateString(),
            'subtotal' => 21186.44,
            'tax_amount' => 3813.56,
            'total_amount' => 25000.0,
            'status' => 'PAID'
        ]);

        InvoiceItem::create([
            'organization_id' => $this->org->id,
            'invoice_id' => $inv2->id,
            'product_variant_id' => $this->product2->id,
            'quantity' => 10.0,
            'unit_price' => 2500.0,
            'tax_amount' => 3813.56,
            'subtotal' => 25000.0
        ]);
    }

    public function test_sales_register_query_without_branch_filter_returns_all_invoices(): void
    {
        $query = new SalesReportQuery();
        $results = $query->getSalesRegister([
            'organization_id' => $this->org->id
        ]);

        $this->assertCount(2, $results);
    }

    public function test_sales_register_query_with_branch_filter_filters_correctly(): void
    {
        $query = new SalesReportQuery();

        $branch1Results = $query->getSalesRegister([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch1->id
        ]);

        $this->assertCount(1, $branch1Results);
        $this->assertEquals('INV-1001', $branch1Results[0]->invoice_number);

        $branch2Results = $query->getSalesRegister([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch2->id
        ]);

        $this->assertCount(1, $branch2Results);
        $this->assertEquals('INV-1002', $branch2Results[0]->invoice_number);
    }

    public function test_sales_by_category_query_returns_aggregated_sales(): void
    {
        $query = new SalesReportQuery();
        $results = $query->getSalesByCategory([
            'organization_id' => $this->org->id
        ]);

        $this->assertCount(2, $results);

        $categoryNames = array_column($results, 'category_name');
        $this->assertContains('Sanitaryware', $categoryNames);
        $this->assertContains('Glazed Vitrified Tiles', $categoryNames);
    }

    public function test_sales_report_service_generates_reports_and_persists_audit_trail(): void
    {
        $service = app(SalesReportService::class);

        $report = $service->generateSalesRegisterReport([
            'organization_id' => $this->org->id,
            'user_id' => 1
        ]);

        $this->assertEquals('sales', $report['report_type']);
        $this->assertEquals('Sales Register Report', $report['report_name']);
        $this->assertCount(2, $report['data']);

        $auditLog = ReportAuditLog::where('organization_id', $this->org->id)->first();
        $this->assertNotNull($auditLog);
        $this->assertEquals('Sales Register Report', $auditLog->report_name);
    }
}
