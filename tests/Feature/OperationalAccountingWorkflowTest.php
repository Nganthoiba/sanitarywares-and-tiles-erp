<?php

namespace Tests\Feature;

use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Services\JournalService;
use App\Domains\Accounting\Services\PostingService;
use App\Domains\Inventory\Models\InventoryAdjustment;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Services\AdjustmentService;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Product\Models\Product;
use App\Domains\Sales\Services\SalesService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationalAccountingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Warehouse $warehouse;
    protected Customer $customer;
    protected Product $product;
    protected PostingService $postingService;
    protected \App\Models\User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'name' => 'Apex Tiles Ltd',
            'code' => 'APEX-01',
            'is_active' => true
        ]);

        $this->user = \App\Models\User::create([
            'organization_id' => $this->org->id,
            'name' => 'Admin User',
            'email' => 'admin@apex.test',
            'password' => bcrypt('password'),
        ]);

        $branch = \App\Domains\Master\Models\Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Branch',
            'code' => 'BR-MAIN',
            'is_active' => true
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse',
            'code' => 'WH-MAIN',
            'is_active' => true
        ]);

        $this->customer = Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'Grand Builders Ltd',
            'code' => 'CUST-001',
            'phone' => '9876543210'
        ]);

        $unit = Unit::create([
            'name' => 'Square Feet',
            'symbol' => 'SQFT',
            'type' => 'MEASUREMENT',
            'decimal_places' => 2
        ]);

        $cat = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Vitrified Tiles',
            'slug' => 'vitrified-tiles',
            'is_active' => true
        ]);

        $brand = Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Somany',
            'slug' => 'somany',
            'is_active' => true
        ]);

        $tax = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'igst_rate' => 18,
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'is_active' => true
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'name' => 'GVT Royal Marble 600x1200',
            'sku' => 'GVT-ROYAL-6012',
            'base_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'purchase_unit_id' => $unit->id,
            'tax_profile_id' => $tax->id,
            'selling_price' => 100.0,
            'cost_price' => 70.0,
        ]);

        $this->postingService = app(PostingService::class);
    }

    /** @test */
    public function test_purchase_and_supplier_payment_workflow_journal_postings()
    {
        $invAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'INV-01', 'Inventory Asset A/c', 'ASSET', 'Current Assets');
        $suppAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'SUPP-101', 'Hindware Supplier', 'LIABILITY', 'Accounts Payable');
        $gstInAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'DUTY-GST-IN-01', 'Input GST A/c', 'ASSET', 'Current Assets');
        $bankAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'BANK-01', 'HDFC Bank A/c', 'ASSET', 'Bank Accounts');

        // 1. Post Purchase Invoice
        $this->postingService->postPurchase(
            $this->org->id,
            1,
            11800.00,
            $invAcc->id,
            $suppAcc->id,
            $gstInAcc->id,
            1800.00,
            'PINV-2026-001',
            now()->toDateString()
        );

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => 'Purchase Invoice posted: PINV-2026-001'
        ]);

        // 2. Post Supplier Payment
        $this->postingService->postPayment(
            $this->org->id,
            1,
            11800.00,
            $suppAcc->id,
            $bankAcc->id,
            'PAY-2026-001',
            now()->toDateString()
        );

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => 'Payment voucher posted: PAY-2026-001'
        ]);
    }

    /** @test */
    public function test_sales_invoice_posts_ar_revenue_and_cogs_entries()
    {
        // Seed Stock Object
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'BULK-TEST-001',
            'quantity' => 500.00,
            'status' => 'AVAILABLE'
        ]);

        $salesService = app(SalesService::class);

        $invoice = $salesService->createDirectSale([
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'payment_method' => 'BANK',
            'paid_amount' => 5000.00,
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 50.0,
                    'unit_price' => 100.0,
                    'unit_id' => $this->product->sales_unit_id ?? 1
                ]
            ]
        ], $this->org->id);

        $this->assertNotNull($invoice);
        $this->assertEquals(5000.00, (float) $invoice->total_amount);

        // Verify Journal Postings (Sales Revenue, Receipt, COGS)
        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => "Sales Invoice posted: {$invoice->invoice_number}"
        ]);

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => "COGS cost of goods sold posted: {$invoice->invoice_number}"
        ]);
    }

    /** @test */
    public function test_inventory_adjustment_loss_and_gain_journal_postings()
    {
        $obj = InventoryObject::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'object_code' => 'BULK-ADJ-001',
            'quantity' => 100.00,
            'status' => 'AVAILABLE'
        ]);

        $adjService = app(AdjustmentService::class);

        // 1. Create & Approve Damage Loss Adjustment
        $adj = $adjService->initiateAdjustment([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'adjustment_type' => 'DAMAGE',
            'reason' => 'Tiles breakage during unloading',
            'items' => [
                [
                    'inventory_object_id' => $obj->id,
                    'quantity_delta' => -10.0
                ]
            ]
        ]);

        $adjService->approveAdjustment($adj->id, $this->user->id);

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'reference_type' => 'InventoryAdjustment',
            'reference_id' => $adj->id
        ]);
    }

    /** @test */
    public function test_purchase_return_and_sales_return_journal_postings()
    {
        $suppAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'SUPP-102', 'Jaquar Supplier', 'LIABILITY', 'Accounts Payable');
        $retAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'PRET-01', 'Purchase Return A/c', 'ASSET', 'Current Assets');
        $gstInAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'DUTY-GST-IN-01', 'Input GST A/c', 'ASSET', 'Current Assets');

        $custAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'CUST-202', 'Modern Decorators', 'ASSET', 'Accounts Receivable');
        $salesRetAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'SRET-01', 'Sales Return A/c', 'INCOME', 'Direct Income');
        $gstOutAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'DUTY-GST-OUT-01', 'Output GST A/c', 'LIABILITY', 'Duties and Taxes');
        $invAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'INV-01', 'Inventory Asset A/c', 'ASSET', 'Current Assets');
        $cogsAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'EXP-COGS-01', 'Cost of Goods Sold A/c', 'EXPENSE', 'Direct Expenses');

        // 1. Purchase Return Debit Note Posting
        $this->postingService->postPurchaseReturn(
            $this->org->id,
            2360.00,
            $suppAcc->id,
            $retAcc->id,
            $gstInAcc->id,
            360.00,
            'DN-2026-001',
            now()->toDateString()
        );

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => 'Purchase Return / Debit Note posted: DN-2026-001'
        ]);

        // 2. Sales Return Credit Note Posting
        $this->postingService->postSalesReturn(
            $this->org->id,
            1180.00,
            700.00,
            $custAcc->id,
            $salesRetAcc->id,
            $gstOutAcc->id,
            180.00,
            $invAcc->id,
            $cogsAcc->id,
            'CN-2026-001',
            now()->toDateString()
        );

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => 'Sales Return / Credit Note posted: CN-2026-001'
        ]);

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => 'Sales Return stock COGS restoration: CN-2026-001'
        ]);
    }

    /** @test */
    public function test_operational_expense_voucher_journal_posting()
    {
        $expAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'EXP-RENT-01', 'Showroom Rent Expense', 'EXPENSE', 'Indirect Expenses');
        $bankAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'BANK-01', 'HDFC Bank A/c', 'ASSET', 'Bank Accounts');
        $gstInAcc = $this->postingService->resolveOrCreateAccount($this->org->id, 'DUTY-GST-IN-01', 'Input GST A/c', 'ASSET', 'Current Assets');

        $this->postingService->postExpenseVoucher(
            $this->org->id,
            59000.00,
            $expAcc->id,
            $bankAcc->id,
            $gstInAcc->id,
            9000.00,
            'EXP-RENT-SEP26',
            now()->toDateString()
        );

        $this->assertDatabaseHas('journals', [
            'organization_id' => $this->org->id,
            'narration' => 'Expense Voucher posted: EXP-RENT-SEP26'
        ]);
    }
}
