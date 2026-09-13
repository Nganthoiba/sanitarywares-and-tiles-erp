<?php

namespace Tests\Feature;

use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Services\ReservationService;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Product\Models\Product;
use App\Domains\Sales\Services\SalesService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected ReservationService $reservationService;
    protected SalesService $salesService;
    protected Organization $org;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected StorageLocation $location;
    protected Unit $unit;
    protected Product $product;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->reservationService = app(ReservationService::class);
        $this->salesService = app(SalesService::class);

        $this->org = Organization::create(['name' => 'Test Org', 'code' => 'TORG', 'slug' => 'test-org']);

        $this->branch = Branch::create([
            'organization_id' => $this->org->id,
            'name' => 'Main Branch',
            'code' => 'MBR',
        ]);

        $this->warehouse = Warehouse::create([
            'organization_id' => $this->org->id,
            'branch_id' => $this->branch->id,
            'code' => 'WH01',
            'name' => 'Main Warehouse',
            'type' => 'MAIN',
            'is_active' => true,
        ]);

        $this->location = StorageLocation::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'code' => 'LOC-A1',
            'name' => 'Section A1',
            'location_type' => 'RACK',
            'is_active' => true,
        ]);

        $category = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles',
        ]);

        $this->unit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
        ]);

        $tax = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'igst_rate' => 18,
        ]);

        $this->product = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $category->id,
            'sku' => 'TILE-6060-PORC',
            'name' => 'Porcelain Tile 60x60',
            'purchase_unit_id' => $this->unit->id,
            'sales_unit_id' => $this->unit->id,
            'base_unit_id' => $this->unit->id,
            'inventory_behavior' => 'BULK',
            'pieces_per_box' => 4,
            'tax_profile_id' => $tax->id,
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'organization_id' => $this->org->id,
            'code' => 'CUST-001',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'is_active' => true,
        ]);

        // Add initial inventory stock
        InventoryObject::create([
            'organization_id' => $this->org->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'product_variant_id' => $this->product->id,
            'object_code' => 'OBJ-001',
            'quantity' => 100,
            'area' => 144.0,
            'unit_id' => $this->unit->id,
            'status' => 'AVAILABLE',
        ]);
    }

    public function test_partial_reservation_fulfillment_lifecycle()
    {
        $reservation = $this->reservationService->reserve([
            'organization_id' => $this->org->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'customer_id' => $this->customer->id,
            'quantity' => 10,
            'area' => 14.40,
            'notes' => 'Test reservation for 10 boxes',
        ]);

        $this->assertEquals('ACTIVE', $reservation->status);
        $this->assertEquals(10, $reservation->quantity);
        $this->assertEquals(0, $reservation->fulfilled_quantity);
        $this->assertEquals(10, $reservation->remaining_quantity);

        // Fulfill 4 boxes
        $partiallyFulfilled = $this->reservationService->fulfill($reservation, 4, 5.76);

        $this->assertEquals('PARTIALLY_FULFILLED', $partiallyFulfilled->status);
        $this->assertEquals(4, $partiallyFulfilled->fulfilled_quantity);
        $this->assertEquals(6, $partiallyFulfilled->remaining_quantity);
        $this->assertEquals(5.76, $partiallyFulfilled->fulfilled_area);

        // Active reserved stock should now only lock remaining (6 boxes)
        $reservedQty = $this->reservationService->getActiveReservedQuantity(
            $this->product->id,
            $this->warehouse->id,
            $this->location->id
        );
        $this->assertEquals(6, $reservedQty);

        // Fulfill remaining 6 boxes
        $fullyFulfilled = $this->reservationService->fulfill($partiallyFulfilled, 6, 8.64);

        $this->assertEquals('FULFILLED', $fullyFulfilled->status);
        $this->assertEquals(10, $fullyFulfilled->fulfilled_quantity);
        $this->assertEquals(0, $fullyFulfilled->remaining_quantity);

        // Active reserved stock should now be 0
        $reservedQtyAfter = $this->reservationService->getActiveReservedQuantity(
            $this->product->id,
            $this->warehouse->id,
            $this->location->id
        );
        $this->assertEquals(0, $reservedQtyAfter);
    }

    public function test_direct_sale_auto_fulfills_active_customer_reservation()
    {
        // Reserve 8 boxes for customer
        $reservation = $this->reservationService->reserve([
            'organization_id' => $this->org->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'storage_location_id' => $this->location->id,
            'customer_id' => $this->customer->id,
            'quantity' => 8,
            'area' => 11.52,
            'notes' => 'Customer reservation',
        ]);

        $this->assertEquals('ACTIVE', $reservation->status);

        // Create direct sale of 5 boxes for the same customer and warehouse
        $saleData = [
            'organization_id' => $this->org->id,
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'paid_amount' => 100,
            'payment_method' => 'CASH',
            'items' => [
                [
                    'product_variant_id' => $this->product->id,
                    'quantity' => 5,
                    'unit_price' => 25.00,
                    'unit_id' => $this->unit->id,
                ],
            ],
        ];

        $invoice = $this->salesService->createDirectSale($saleData, $this->org->id);

        $reservation->refresh();

        // Should auto-fulfill 5 boxes and transition to PARTIALLY_FULFILLED
        $this->assertEquals('PARTIALLY_FULFILLED', $reservation->status);
        $this->assertEquals(5, $reservation->fulfilled_quantity);
        $this->assertEquals(3, $reservation->remaining_quantity);
    }
}
