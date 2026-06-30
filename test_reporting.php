<?php

use Illuminate\Contracts\Console\Kernel;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\ProductFamily;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Reporting\Services\InventoryReportService;
use App\Domains\Reporting\Services\SalesReportService;
use App\Domains\Reporting\Services\DashboardService;
use App\Domains\Reporting\Services\AuditReportService;
use App\Domains\Reporting\Models\ReportAuditLog;
use App\Domains\Reporting\Jobs\RefreshSnapshotsJob;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "--- Bootstrapped Laravel 12 workspace context for Reporting Engine Validation ---\n";

\Illuminate\Support\Facades\DB::transaction(function () {
    // 1. Setup multi-tenant seed records
    $org = Organization::firstOrCreate(['id' => 1]);
    $branch = Branch::firstOrCreate([
        'organization_id' => $org->id,
        'code' => 'REP-BR-1',
        'name' => 'Reporting Test Branch'
    ]);
    $wh = Warehouse::firstOrCreate([
        'organization_id' => $org->id,
        'branch_id' => $branch->id,
        'code' => 'REP-WH-1',
        'name' => 'Reporting Central Whse',
        'type' => 'MAIN',
        'is_active' => true
    ]);

    $cat = Category::firstOrCreate([
        'organization_id' => $org->id,
        'name' => 'Vitreous China Sanitaryware',
        'slug' => 'vitreous-china-sanitaryware'
    ]);

    $unit = Unit::firstOrCreate([
        'organization_id' => $org->id,
        'symbol' => 'PCS'
    ], [
        'name' => 'Pieces',
        'type' => 'PIECE',
        'decimal_places' => 0
    ]);

    $pf = ProductFamily::firstOrCreate([
        'organization_id' => $org->id,
        'category_id' => $cat->id,
        'name' => 'Closets Family',
        'code' => 'CLST-FAM'
    ]);

    $gst18 = \App\Domains\Master\Models\TaxProfile::firstOrCreate([
        'organization_id' => $org->id,
        'name' => 'GST 18%'
    ], [
        'hsn_code' => '6907',
        'cgst_rate' => 9,
        'sgst_rate' => 9,
        'igst_rate' => 18
    ]);

    $variant = ProductVariant::firstOrCreate([
        'organization_id' => $org->id,
        'product_family_id' => $pf->id,
        'purchase_unit_id' => $unit->id,
        'sales_unit_id' => $unit->id,
        'base_unit_id' => $unit->id,
        'name' => 'Premium Wall Hung Water Closet',
        'sku' => 'SAN-CLST-01',
        'inventory_behavior' => 'SLAB',
        'tax_profile_id' => $gst18->id
    ]);

    echo "1. Master registers seeded.\n";

    // 2. Setup inventory item movements
    $invObj = InventoryObject::create([
        'organization_id' => $org->id,
        'warehouse_id' => $wh->id,
        'product_variant_id' => $variant->id,
        'status' => 'ON_HAND',
        'object_code' => 'GRAN-SLAB-50',
        'quantity' => 1.0000,
        'area' => 50.0000 // (120*60)/144 = 50.0 SQFT
    ]);

    \App\Domains\Inventory\Models\GraniteSlabDetail::create([
        'inventory_object_id' => $invObj->id,
        'length' => 120,
        'width' => 60,
        'thickness' => 20,
        'finish' => 'POLISHED',
        'origin' => 'IMPORT'
    ]);

    InventoryMovement::create([
        'organization_id' => $org->id,
        'inventory_object_id' => $invObj->id,
        'movement_type' => 'PURCHASE',
        'quantity_delta' => 1
    ]);

    echo "2. Inventory transaction objects and movement ledger details written.\n";

    // 3. Trigger Report services
    $invService = app(InventoryReportService::class);
    $salesService = app(SalesReportService::class);
    $dashboardService = app(DashboardService::class);
    $auditService = app(AuditReportService::class);

    $filters = [
        'organization_id' => $org->id,
        'warehouse_id' => $wh->id,
        'branch_id' => $branch->id,
        'user_id' => 1
    ];

    echo "\n=== TRIGGERING REPORT ENGINE GENERATORS ===\n";

    // Test current stock
    $stockReport = $invService->generateCurrentStockReport($filters);
    echo "Current Stock Report status code: " . ($stockReport['success'] ? 'SUCCESS' : 'FAILED') . "\n";
    echo "Current Stock records: " . $stockReport['record_count'] . "\n";
    if ($stockReport['record_count'] > 0) {
        echo " - Product in stock: " . $stockReport['data'][0]->product_name . "\n";
        echo " - Total Area: " . $stockReport['data'][0]->total_area . " SQFT\n";
    }

    // Test log tracking
    $ledgerReport = $invService->generateStockLedgerReport($filters);
    echo "Stock Ledger records: " . $ledgerReport['record_count'] . "\n";

    // Test dashboard totals
    $dashReport = $dashboardService->getDashboardSummary($filters);
    echo "Executive Dashboard Slabs on Hand count: " . $dashReport['data'][0]['total_slabs_on_hand'] . "\n";

    // Test background refresh snapshots job
    echo "\nTriggering Background Snapshot cache update job...\n";
    RefreshSnapshotsJob::dispatch(['organization_id' => $org->id, 'user_id' => 1]);

    // Test audit log
    $auditReport = $auditService->generateReportAuditLogReport($filters);
    echo "Total Report audit trails compiled: " . $auditReport['record_count'] . "\n";
    if ($auditReport['record_count'] > 1) {
        echo " - Executed: `" . $auditReport['data'][0]['report_name'] . "` within " . number_format($auditReport['data'][0]['execution_time_ms'], 2) . " ms\n";
        echo " - Executed: `" . $auditReport['data'][1]['report_name'] . "` within " . number_format($auditReport['data'][1]['execution_time_ms'], 2) . " ms\n";
    }

    if ($stockReport['success'] && $auditReport['record_count'] >= 2 && floatval($stockReport['data'][0]->total_area) === 50.0) {
        echo "\n=== SUCCESS: BI Reporting Engine validated and cached successfully! ===\n";
    } else {
        echo "\n=== FAILURE: Reporting validation checks failed. ===\n";
    }

    throw new \Exception("Rollback transaction to maintain pristine state.");
});
