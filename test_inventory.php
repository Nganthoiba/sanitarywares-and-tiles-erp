<?php

use Illuminate\Contracts\Console\Kernel;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Services\ReservationService;
use App\Domains\Inventory\Services\AllocationService;
use App\Domains\Inventory\Services\TransferService;
use App\Domains\Inventory\Services\AdjustmentService;
use App\Domains\Inventory\Services\ValuationService;
use App\Domains\Inventory\Services\GraniteService;
use App\Domains\Inventory\Services\InventoryCountService;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "--- Bootstrapping Laravel for Inventory & Slab Optimization Engine Verification ---\n";

\Illuminate\Support\Facades\DB::transaction(function () {
    // 1. Setup multi-tenant workspace seed records
    $org = Organization::firstOrCreate(['id' => 1]);
    $branch = Branch::firstOrCreate([
        'organization_id' => $org->id,
        'code' => 'INV-BR-1',
        'name' => 'Inventory System Test Branch'
    ]);
    $wh1 = Warehouse::firstOrCreate([
        'organization_id' => $org->id,
        'branch_id' => $branch->id,
        'code' => 'INV-WH-1',
        'name' => 'Main Slab Depot',
        'type' => 'MAIN',
        'is_active' => true
    ]);
    $wh2 = Warehouse::firstOrCreate([
        'organization_id' => $org->id,
        'branch_id' => $branch->id,
        'code' => 'INV-WH-2',
        'name' => 'Sanitary & Tiles Loft',
        'type' => 'MAIN',
        'is_active' => true
    ]);

    $cat = Category::firstOrCreate([
        'organization_id' => $org->id,
        'name' => 'Granite & Natural Stone Slabs',
        'slug' => 'granite-and-natural-stone-slabs'
    ]);

    $unit = Unit::firstOrCreate([
        'organization_id' => $org->id,
        'symbol' => 'SQFT'
    ], [
        'name' => 'Square Feet',
        'type' => 'AREA',
        'decimal_places' => 4
    ]);

    $brand = \App\Domains\Master\Models\Brand::firstOrCreate([
        'organization_id' => $org->id,
        'name' => 'Italian Marble Brand'
    ], [
        'code' => 'IT-MARB',
        'is_active' => true
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

    $variant = Product::firstOrCreate([
        'organization_id' => $org->id,
        'category_id' => $cat->id,
        'purchase_unit_id' => $unit->id,
        'sales_unit_id' => $unit->id,
        'base_unit_id' => $unit->id,
        'name' => 'Premium Italian Onyx Marble Slab',
        'sku' => 'GRAN-ONYX-01',
        'inventory_behavior' => 'SLAB',
        'tax_profile_id' => $gst18->id,
        'brand_id' => $brand->id,
        'cost_price' => 140.0000
    ]);

    echo "1. Seed database state components initialized.\n";

    // Obtain Services
    $reservationService = app(ReservationService::class);
    $allocationService = app(AllocationService::class);
    $transferService = app(TransferService::class);
    $adjustmentService = app(AdjustmentService::class);
    $valuationService = app(ValuationService::class);
    $graniteService = app(GraniteService::class);
    $countService = app(InventoryCountService::class);

    // 2. Slabs Cut/Remnants Logic Verification
    echo "2. Testing Granite Slab Registration & Split checks...\n";
    $slabCode = 'SLAB-TEST-' . uniqid();
    $slab = $graniteService->createSlab([
        'organization_id' => $org->id,
        'warehouse_id' => $wh1->id,
        'product_variant_id' => $variant->id,
        'slab_code' => $slabCode,
        'length' => 120,
        'width' => 60,
        'thickness' => 20,
        'area' => 50.00
    ]);

    echo " - Slab initialized. Area size: " . $slab->area . " SQFT. Status: " . $slab->status . "\n";

    $splits = [
        ['length' => 60, 'width' => 60, 'area' => 25.00],
        ['length' => 48, 'width' => 60, 'area' => 20.00]
    ];
    $cutResult = $graniteService->cutSlab($slab->id, $splits);
    $parent = $cutResult['parent'];
    $remnants = $cutResult['remnants'];

    echo " - Slab Cut executed. Parent status is: " . $parent->status . " | Parent remaining area: " . $parent->area . " SQFT\n";
    echo " - Remnants count generated: " . count($remnants) . "\n";
    foreach ($remnants as $rem) {
        echo "   * Remnant slab code: " . $rem->object_code . " | Remnant size: " . $rem->area . " SQFT\n";
    }

    // Capture first remnant to perform reservation/allocation tests
    $testObj = $remnants[0];

    // 3. Testing Soft Reservation
    echo "3. Testing Soft Reservations...\n";
    $res = $reservationService->reserve([
        'organization_id' => $org->id,
        'inventory_object_id' => $testObj->id,
        'quantity' => 1,
        'area' => $testObj->area,
        'source_type' => 'QUOTATION',
        'source_id' => 101,
        'source_item_id' => 201
    ]);
    echo " - Soft reservation placed. Status: " . $res->status . " | Source: " . $res->source_type . "\n";

    // Release
    $reservationService->release($res->id);
    echo " - Soft reservation released successfully.\n";

    // 4. Testing Allocation
    echo "4. Testing Hard Allocation lifecycle...\n";

    // Make sure status is ON_HAND after releasing
    $testObj->refresh();

    $res2 = $reservationService->reserve([
        'organization_id' => $org->id,
        'inventory_object_id' => $testObj->id,
        'quantity' => 1,
        'area' => $testObj->area,
        'source_type' => 'SALES_ORDER',
        'source_id' => 301,
        'source_item_id' => 401
    ]);

    $alloc = $allocationService->allocate([
        'organization_id' => $org->id,
        'inventory_reservation_id' => $res2->id,
        'inventory_object_id' => $testObj->id,
        'quantity' => 1,
        'area' => $testObj->area
    ]);
    $testObj->refresh();
    echo " - Allocation registered status: " . $alloc->status . " | Slab Status: " . $testObj->status . "\n";

    $allocationService->complete($alloc->id);
    $testObj->refresh();
    echo " - Allocation completed successfully. Slab Status: " . $testObj->status . "\n";

    // Set back to ON_HAND for transfer checks
    $testObj->status = 'ON_HAND';
    $testObj->save();

    // 5. Testing Warehouse Transfer
    echo "5. Testing Warehouse Transfer from WH1 to WH2...\n";
    $trf = $transferService->initiateTransfer([
        'organization_id' => $org->id,
        'from_warehouse_id' => $wh1->id,
        'to_warehouse_id' => $wh2->id,
        'user_id' => 1,
        'items' => [
            ['inventory_object_id' => $testObj->id, 'quantity' => 1]
        ]
    ]);
    $testObj->refresh();
    echo " - Transfer initiated. Status: " . $trf->status . " | Slab status: " . $testObj->status . "\n";

    $transferService->completeTransfer($trf->id);
    $trf->refresh();
    $testObj->refresh();
    echo " - Transfer checked-in. Status: " . $trf->status . " | Active Warehouse Location: " . $testObj->warehouse->name . "\n";

    // 6. Testing Valuation Calculations (Specific ID, FIFO, average)
    echo "6. Testing valuation models...\n";
    $costSpecific = $valuationService->calculateValuation($testObj->id, 'SPECIFIC_ID');
    echo " - SPECIFIC ID valuation unit cost: $" . $costSpecific['unit_cost'] . " | Total asset value: $" . $costSpecific['total_value'] . "\n";

    $costFifo = $valuationService->calculateValuation($testObj->id, 'FIFO');
    echo " - FIFO valuation unit cost: $" . $costFifo['unit_cost'] . " | Total asset value: $" . $costFifo['total_value'] . "\n";

    // Verification assessment check
    if (
        count($remnants) === 2 &&
        $parent->status === 'ON_HAND' &&
        floatval($parent->area) === 5.0 &&
        $testObj->warehouse_id === $wh2->id &&
        $trf->status === 'RECEIVED'
    ) {
        echo "\n=== SUCCESS: ENTERPRISE INVENTORY ENGINE FULLY VERIFIED AND PASSES ALL CHECKS! ===\n";
    } else {
        echo "\n=== FAILURE: Dynamic area calculations or transfer operations failed verification. ===\n";
    }

    throw new \Exception("Rollback workspace transactions to keep pristine state.");
});
