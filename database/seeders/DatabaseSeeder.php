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
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
use App\Domains\Product\Models\UnitConversion;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Models\GraniteSlabDetail;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Accounting\Models\Account;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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
            ['organization_id' => $org->id, 'name' => 'Admin User', 'password' => bcrypt('password')]
        );

        $staffUser = User::firstOrCreate(
            ['email' => 'sales@acme.com'],
            ['organization_id' => $org->id, 'name' => 'Sales Officer', 'password' => bcrypt('password')]
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
            'type' => 'MAIN',
            'is_active' => true,
            'address' => 'Navi Mumbai',
        ]);

        $loc = StorageLocation::create([
            'organization_id' => $org->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Tile Rack A01',
            'location_type' => 'STAND',
            'code' => 'R1-C1-S1-B1',
        ]);

        $gst18 = TaxProfile::create([
            'organization_id' => $org->id,
            'name' => 'GST 18%',
            'hsn_code' => '6907',
            'cgst_rate' => 9.00,
            'sgst_rate' => 9.00,
            'igst_rate' => 18.00,
            'is_active' => true,
        ]);

        $boxUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);

        $sqftUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Square Feet',
            'symbol' => 'SQFT',
            'type' => 'AREA',
            'decimal_places' => 2,
        ]);

        $pcsUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Piece',
            'symbol' => 'PCS',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);

        $slabUnit = Unit::create([
            'organization_id' => $org->id,
            'name' => 'Slab',
            'symbol' => 'SLAB',
            'type' => 'QUANTITY',
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
        $defaultPermissions = [
            'Master Data' => [
                'master.organizations.view' => 'View Organization details',
                'master.organizations.update' => 'Update Organization details',
                'master.branches.manage' => 'Manage Branches',
                'master.warehouses.manage' => 'Manage Warehouses',
                'master.users.manage' => 'Manage Users and Roles',
            ],
            'Inventory Management' => [
                'inventory.stock.view' => 'View Stock Levels',
                'inventory.transfer.execute' => 'Execute Inventory Transfers',
                'inventory.adjustment.approve' => 'Approve Stock Adjustments',
                'inventory.count.manage' => 'Manage Inventory Counts',
            ],
            'Purchase Domain' => [
                'purchase.requisitions.manage' => 'Manage Purchase Requisitions',
                'purchase.orders.create' => 'Create Purchase Orders',
                'purchase.orders.approve' => 'Approve Purchase Orders',
            ],
            'Sales Domain' => [
                'sales.orders.manage' => 'Manage Sales Orders',
                'sales.invoice.cancel' => 'Cancel Sales Invoices',
            ],
            'Accounting Domain' => [
                'accounting.accounts.manage' => 'Manage Accounts & Ledgers',
                'accounting.journal.post' => 'Post Journal Entries',
            ],
            'Workflow Management' => [
                'workflow.definition.manage' => 'Manage Workflows Definitions',
            ]
        ];

        $permissionIds = [];
        $viewStockPermId = null;

        foreach ($defaultPermissions as $groupName => $perms) {
            $group = PermissionGroup::create([
                'organization_id' => $org->id,
                'name' => $groupName
            ]);

            foreach ($perms as $slug => $name) {
                $p = Permission::create([
                    'organization_id' => $org->id,
                    'permission_group_id' => $group->id,
                    'name' => $name,
                    'slug' => $slug
                ]);
                $permissionIds[] = $p->id;

                if ($slug === 'inventory.stock.view') {
                    $viewStockPermId = $p->id;
                }
            }
        }

        // Create Administrator Role & Assign Permissions
        $adminRole = Role::create([
            'organization_id' => $org->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_system' => true
        ]);
        $adminRole->permissions()->attach($permissionIds, ['organization_id' => $org->id]);

        // Assign Administrator Role to the Admin User
        $adminUser->roles()->attach($adminRole->id, ['organization_id' => $org->id]);

        // Create Warehouse Manager Role & Assign to Staff User
        $warehouseRole = Role::create([
            'organization_id' => $org->id,
            'name' => 'Warehouse Manager',
            'slug' => 'warehouse-manager',
            'is_system' => false,
        ]);
        if ($viewStockPermId) {
            $warehouseRole->permissions()->attach($viewStockPermId, ['organization_id' => $org->id]);
        }
        $staffUser->roles()->attach($warehouseRole->id, ['organization_id' => $org->id]);

        // Assign scopes
        UserScope::create([
            'organization_id' => $org->id,
            'user_id' => $adminUser->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
        ]);

        UserScope::create([
            'organization_id' => $org->id,
            'user_id' => $staffUser->id,
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
        $tileVariant = Product::create([
            'organization_id' => $org->id,
            'category_id' => $tileCat->id,
            'purchase_unit_id' => $boxUnit->id,
            'sales_unit_id' => $pcsUnit->id,
            'base_unit_id' => $pcsUnit->id,
            'name' => 'Kajaria Royal Gold 600x600 mm',
            'sku' => 'KAJ-ROY-GLD-600',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $gst18->id,
            'brand_id' => $kajaria->id,
            'manufacturer_id' => $mfgLocal->id,
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

        $graniteSlab = Product::create([
            'organization_id' => $org->id,
            'category_id' => $graniteCat->id,
            'purchase_unit_id' => $sqftUnit->id,
            'sales_unit_id' => $sqftUnit->id,
            'base_unit_id' => $sqftUnit->id,
            'name' => 'Black Galaxy Granite Slab Premium',
            'sku' => 'BLK-GAL-SLAB-P',
            'inventory_behavior' => 'SLAB',
            'tax_profile_id' => $gst18->id,
            'brand_id' => $kajaria->id,
            'manufacturer_id' => null,
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
            'quantity' => 100.0000,
            'batch_number' => 'BATCH-2026-T1',
            'status' => 'AVAILABLE',
            'object_code' => 'TILE-STOCK-001',
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
            'object_code' => 'BG001',
            'quantity' => 1.0000,
            'area' => 60.5000,
            'status' => 'AVAILABLE',
        ]);

        GraniteSlabDetail::create([
            'inventory_object_id' => $slab1->id,
            'length' => 10.00,
            'width' => 6.05,
            'thickness' => 20.00, // 20mm
            'finish' => 'Polished',
            'origin' => 'Rajasthan',
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
