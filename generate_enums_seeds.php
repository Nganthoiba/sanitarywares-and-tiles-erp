<?php

function create_file($path, $content)
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents($path, trim($content) . "\n");
    echo "Created: $path\n";
}

$app_dir = __DIR__ . '/app/Domains';
$seeder_dir = __DIR__ . '/database/seeders';

// ----------------------------------------------------
// 1. PHP ENUMS DEFINITIONS
// ----------------------------------------------------

create_file(
    "$app_dir/Product/Enums/InventoryType.php",
    <<<'PHP'
<?php
namespace App\Domains\Product\Enums;

enum InventoryType: string {
    case STANDARD = 'STANDARD';
    case CONVERTIBLE = 'CONVERTIBLE';
    case SLAB = 'SLAB';
    case SERIAL = 'SERIAL';
    case BATCH = 'BATCH';
    case BUNDLE = 'BUNDLE';
    case ROLL = 'ROLL';
}
PHP
);

create_file(
    "$app_dir/Inventory/Enums/InventoryStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Inventory\Enums;

enum InventoryStatus: string {
    case AVAILABLE = 'AVAILABLE';
    case RESERVED = 'RESERVED';
    case ALLOCATED = 'ALLOCATED';
    case PICKED = 'PICKED';
    case DISPATCHED = 'DISPATCHED';
    case DAMAGED = 'DAMAGED';
    case RETURNED = 'RETURNED';
    case SCRAPPED = 'SCRAPPED';
}
PHP
);

create_file(
    "$app_dir/Inventory/Enums/InventoryMovementType.php",
    <<<'PHP'
<?php
namespace App\Domains\Inventory\Enums;

enum InventoryMovementType: string {
    case PURCHASE = 'PURCHASE';
    case SALE = 'SALE';
    case RETURN = 'RETURN';
    case TRANSFER = 'TRANSFER';
    case ADJUSTMENT = 'ADJUSTMENT';
    case DAMAGE = 'DAMAGE';
    case ALLOCATION = 'ALLOCATION';
    case REALLOCATION = 'REALLOCATION';
}
PHP
);

create_file(
    "$app_dir/Purchase/Enums/PurchaseRequisitionStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Purchase\Enums;

enum PurchaseRequisitionStatus: string {
    case DRAFT = 'DRAFT';
    case PENDING = 'PENDING';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case ORDERED = 'ORDERED';
}
PHP
);

create_file(
    "$app_dir/Purchase/Enums/PurchaseOrderStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Purchase\Enums;

enum PurchaseOrderStatus: string {
    case DRAFT = 'DRAFT';
    case SENT = 'SENT';
    case PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
}
PHP
);

create_file(
    "$app_dir/Purchase/Enums/GoodsReceiptStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Purchase\Enums;

enum GoodsReceiptStatus: string {
    case RECEIVED = 'RECEIVED';
    case INSPECTED = 'INSPECTED';
    case PUT_AWAY = 'PUT_AWAY';
}
PHP
);

create_file(
    "$app_dir/Sales/Enums/QuotationStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Sales\Enums;

enum QuotationStatus: string {
    case DRAFT = 'DRAFT';
    case SENT = 'SENT';
    case ACCEPTED = 'ACCEPTED';
    case REJECTED = 'REJECTED';
    case EXPIRED = 'EXPIRED';
}
PHP
);

create_file(
    "$app_dir/Sales/Enums/SalesOrderStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Sales\Enums;

enum SalesOrderStatus: string {
    case DRAFT = 'DRAFT';
    case APPROVED = 'APPROVED';
    case PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
}
PHP
);

create_file(
    "$app_dir/Sales/Enums/InvoiceStatus.php",
    <<<'PHP'
<?php
namespace App\Domains\Sales\Enums;

enum InvoiceStatus: string {
    case UNPAID = 'UNPAID';
    case PARTIALLY_PAID = 'PARTIALLY_PAID';
    case PAID = 'PAID';
    case CANCELLED = 'CANCELLED';
}
PHP
);

create_file(
    "$app_dir/Accounting/Enums/AccountType.php",
    <<<'PHP'
<?php
namespace App\Domains\Accounting\Enums;

enum AccountType: string {
    case ASSET = 'ASSET';
    case LIABILITY = 'LIABILITY';
    case EQUITY = 'EQUITY';
    case REVENUE = 'REVENUE';
    case EXPENSE = 'EXPENSE';
}
PHP
);

// ----------------------------------------------------
// 2. COMPREHENSIVE SEEDER FOR ENTIRE FLOW
// ----------------------------------------------------

create_file(
    "$seeder_dir/DatabaseSeeder.php",
    <<<'PHP'
<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Supplier;
use App\Domains\Security\Models\PermissionGroup;
use App\Domains\Security\Models\Permission;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\UserRole;
use App\Domains\Security\Models\UserScope;
use App\Domains\Product\Models\ProductFamily;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
use App\Domains\Product\Models\UnitConversion;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Accounting\Models\Account;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        // 1. Create Organization
        $org = Organization::create([
            'name' => 'Acme Building Materials Ltd',
            'code' => 'ACME001',
            'gstin' => '27AAACA1234A1Z1',
            'pan' => 'AAACA1234A',
            'email' => 'contact@acme.com',
            'phone' => '0221234567',
            'address' => '101, Industrial Area, Mumbai',
            'is_active' => true,
        ]);

        // Create Default Users
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@acme.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password')]
        );

        $staffUser = User::firstOrCreate(
            ['email' => 'sales@acme.com'],
            ['name' => 'Sales Officer', 'password' => bcrypt('password')]
        );

        // 2. Master Domain Entities
        $branch = Branch::create([
            'organization_id' => $org->id,
            'name' => 'Mumbai Main Branch',
            'code' => 'MUM-B1',
            'email' => 'mumbai@acme.com',
            'phone' => '0229876543',
            'address' => 'Fort, Mumbai',
        ]);

        $warehouse = Warehouse::create([
            'organization_id' => $org->id,
            'branch_id' => $branch->id,
            'name' => 'Central Warehouse',
            'code' => 'MUM-W1',
            'address' => 'Navi Mumbai',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $org->id,
            'warehouse_id' => $warehouse->id,
            'row' => 'R1',
            'column' => 'C1',
            'shelf' => 'S1',
            'bin' => 'B1',
            'code' => 'R1-C1-S1-B1',
        ]);

        $gst18 = TaxProfile::create([
            'organization_id' => $org->id,
            'name' => 'GST 18%',
            'rate' => 18.00,
            'is_active' => true,
        ]);

        $boxUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Box',
            'code' => 'BOX',
            'decimal_places' => 0,
        ]);

        $sqftUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Square Feet',
            'code' => 'SQFT',
            'decimal_places' => 2,
        ]);

        $pcsUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Piece',
            'code' => 'PCS',
            'decimal_places' => 0,
        ]);

        $tileCat = Category::create([
            'organization_id' => $org->id,
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles',
        ]);

        $graniteCat = Category::create([
            'organization_id' => $org->id,
            'name' => 'Granite Slabs',
            'slug' => 'granite-slabs',
        ]);

        $kajaria = Brand::create([
            'organization_id' => $org->id,
            'name' => 'Kajaria',
            'slug' => 'kajaria',
        ]);

        $mfgLocal = Manufacturer::create([
            'organization_id' => $org->id,
            'name' => 'Morbi Tile Industries',
        ]);

        $supplier = Supplier::create([
            'organization_id' => $org->id,
            'name' => 'Stone & Tile Wholesalers',
            'code' => 'SUPP-STW',
            'email' => 'sales@stw.com',
            'phone' => '1234567890',
            'gstin' => '24SUPPL1234A1Z1',
        ]);

        $customer = Customer::create([
            'organization_id' => $org->id,
            'name' => 'Apex Constructions',
            'code' => 'CUST-APEX',
            'email' => 'procurement@apex.com',
            'phone' => '9999888877',
            'gstin' => '27APEXC1234A1Z1',
        ]);

        // 3. Security Roles & Scopes
        $permGroup = PermissionGroup::create([
            'organization_id' => $org->id,
            'name' => 'Inventory Management',
        ]);

        $perm = Permission::create([
            'organization_id' => $org->id,
            'permission_group_id' => $permGroup->id,
            'name' => 'View Stock',
            'slug' => 'view-stock',
        ]);

        $role = Role::create([
            'organization_id' => $org->id,
            'name' => 'Warehouse Manager',
            'slug' => 'warehouse-manager',
            'is_system' => false,
        ]);

        $role->permissions()->attach($perm->id, ['organization_id' => $org->id]);
        $adminUser->roles()->attach($role->id, ['organization_id' => $org->id]);

        UserScope::create([
            'organization_id' => $org->id,
            'user_id' => $adminUser->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
        ]);

        // 4. Accounting Structure Seed
        $assets = AccountGroup::create([
            'organization_id' => $org->id,
            'name' => 'Current Assets',
            'code' => '100000',
            'type' => 'ASSET',
        ]);

        $bankAcc = Account::create([
            'organization_id' => $org->id,
            'account_group_id' => $assets->id,
            'name' => 'HDFC Bank A/c',
            'code' => '100101',
            'currency' => 'INR',
        ]);

        $revenue = AccountGroup::create([
            'organization_id' => $org->id,
            'name' => 'Sales Revenue',
            'code' => '400000',
            'type' => 'REVENUE',
        ]);

        $salesAcc = Account::create([
            'organization_id' => $org->id,
            'account_group_id' => $revenue->id,
            'name' => 'Product Sales',
            'code' => '400101',
            'currency' => 'INR',
        ]);

        // 5. Product Domain Setup: Tiles & Granite Slabs
        // Product 1: Kajaria Royal Tile 600x600 (STANDARD Batch/Box Inventory)
        $tileFamily = ProductFamily::create([
            'organization_id' => $org->id,
            'category_id' => $tileCat->id,
            'brand_id' => $kajaria->id,
            'tax_profile_id' => $gst18->id,
            'name' => 'Kajaria Royal Series',
            'code' => 'KAJ-ROY',
        ]);

        $tileVariant = ProductVariant::create([
            'organization_id' => $org->id,
            'product_family_id' => $tileFamily->id,
            'unit_id' => $boxUnit->id,
            'name' => 'Kajaria Royal Gold 600x600 mm',
            'sku' => 'KAJ-ROY-GLD-600',
            'inventory_type' => 'STANDARD',
            'cost_price' => 120.00,
            'sale_price' => 180.00,
        ]);

        // Attributes for Tiles
        $lenAttr = ProductAttribute::create(['organization_id' => $org->id, 'name' => 'Length (mm)', 'slug' => 'length-mm', 'type' => 'number']);
        $widAttr = ProductAttribute::create(['organization_id' => $org->id, 'name' => 'Width (mm)', 'slug' => 'width-mm', 'type' => 'number']);

        ProductAttributeValue::create(['organization_id' => $org->id, 'product_variant_id' => $tileVariant->id, 'product_attribute_id' => $lenAttr->id, 'value' => '600']);
        ProductAttributeValue::create(['organization_id' => $org->id, 'product_variant_id' => $tileVariant->id, 'product_attribute_id' => $widAttr->id, 'value' => '600']);

        // Conversion from BOX to SQFT (1 Box = 15.5 sqft)
        UnitConversion::create([
            'organization_id' => $org->id,
            'product_variant_id' => $tileVariant->id,
            'from_unit_id' => $boxUnit->id,
            'to_unit_id' => $sqftUnit->id,
            'multiplier' => 15.50,
        ]);

        // Product 2: Black Galaxy Granite Slab (SLAB Inventory)
        $graniteFamily = ProductFamily::create([
            'organization_id' => $org->id,
            'category_id' => $graniteCat->id,
            'brand_id' => null,
            'tax_profile_id' => $gst18->id,
            'name' => 'Black Galaxy Slabs',
            'code' => 'BLK-GAL',
        ]);

        $graniteSlab = ProductVariant::create([
            'organization_id' => $org->id,
            'product_family_id' => $graniteFamily->id,
            'unit_id' => $sqftUnit->id,
            'name' => 'Black Galaxy Granite Slab Premium',
            'sku' => 'BLK-GAL-SLAB-P',
            'inventory_type' => 'SLAB',
            'cost_price' => 200.00,
            'sale_price' => 350.00,
        ]);

        // 6. Seed Initial Stock Objects
        // Tile Stock: 100 boxes in warehouse
        $tileStock = InventoryObject::create([
            'organization_id' => $org->id,
            'product_variant_id' => $tileVariant->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'quantity_on_hand' => 100.0000,
            'batch_number' => 'BATCH-2026-T1',
            'status' => 'AVAILABLE',
        ]);

        InventoryMovement::create([
            'organization_id' => $org->id,
            'inventory_object_id' => $tileStock->id,
            'movement_type' => 'ADJUSTMENT',
            'quantity_delta' => 100.0000,
            'to_warehouse_id' => $warehouse->id,
            'to_storage_location_id' => $loc->id,
            'reference_type' => 'ManualAdjust',
            'reference_id' => 1,
            'user_id' => $adminUser->id,
        ]);

        // Granite Slab Stock: BG001 of 60.50 SqFt
        $slab1 = InventoryObject::create([
            'organization_id' => $org->id,
            'product_variant_id' => $graniteSlab->id,
            'warehouse_id' => $warehouse->id,
            'storage_location_id' => $loc->id,
            'slab_code' => 'BG001',
            'length' => 10.00,
            'width' => 6.05,
            'thickness' => 20.00, // 20mm
            'finish' => 'Polished',
            'origin' => 'Rajasthan',
            'quantity_on_hand' => 1.0000,
            'area_on_hand' => 60.5000,
            'status' => 'AVAILABLE',
        ]);

        InventoryMovement::create([
            'organization_id' => $org->id,
            'inventory_object_id' => $slab1->id,
            'movement_type' => 'ADJUSTMENT',
            'quantity_delta' => 1.0000,
            'area_delta' => 60.5000,
            'to_warehouse_id' => $warehouse->id,
            'reference_type' => 'ManualAdjust',
            'reference_id' => 2,
            'user_id' => $adminUser->id,
        ]);
    }
}
PHP
);

echo "Completed writing Enums and Seeds successfully!\n";
