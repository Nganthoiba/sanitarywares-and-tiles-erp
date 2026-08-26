<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
use App\Domains\Product\Models\UnitConversion;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Models\GraniteSlabDetail;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        if (!$org) return;

        $category = Category::where('organization_id', $org->id)->first();
        $graniteCat = Category::where('organization_id', $org->id)->where('slug', 'granite-slabs')->first() ?? $category;
        $brand = Brand::where('organization_id', $org->id)->first();
        $taxProfile = TaxProfile::first();
        $mfg = Manufacturer::first();

        // Fetch global units
        $boxUnit = Unit::where('symbol', 'box')->first() ?? Unit::first();
        $sqftUnit = Unit::whereIn('symbol', ['sq.ft.', 'sqft'])->first() ?? Unit::first();
        $mmUnit = Unit::where('symbol', 'mm')->first();

        if (!$category || !$brand || !$taxProfile || !$boxUnit || !$sqftUnit) return;

        // 1. Ceramic Tile Product
        $tileVariant = Product::updateOrCreate(
            ['organization_id' => $org->id, 'sku' => 'KAJ-ROY-GLD-600'],
            [
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'manufacturer_id' => $mfg?->id,
                'purchase_unit_id' => $boxUnit->id,
                'sales_unit_id' => $boxUnit->id,
                'base_unit_id' => $boxUnit->id,
                'name' => 'Royal Gold Polish Vitrified Tile 600x600',
                'inventory_behavior' => 'STANDARD',
                'tax_profile_id' => $taxProfile->id,
                'cost_price' => 120.00,
                'sale_price' => 180.00,
                'is_active' => true,
            ]
        );

        // Product Attributes
        $lenAttr = ProductAttribute::updateOrCreate(
            ['organization_id' => $org->id, 'slug' => 'length'],
            ['name' => 'Length', 'type' => 'number', 'unit_id' => $mmUnit?->id]
        );
        $widAttr = ProductAttribute::updateOrCreate(
            ['organization_id' => $org->id, 'slug' => 'width'],
            ['name' => 'Width', 'type' => 'number', 'unit_id' => $mmUnit?->id]
        );

        ProductAttributeValue::updateOrCreate(
            ['organization_id' => $org->id, 'product_variant_id' => $tileVariant->id, 'product_attribute_id' => $lenAttr->id],
            ['value' => '600']
        );
        ProductAttributeValue::updateOrCreate(
            ['organization_id' => $org->id, 'product_variant_id' => $tileVariant->id, 'product_attribute_id' => $widAttr->id],
            ['value' => '600']
        );

        // Conversion (1 Box = 15.5 SqFt)
        UnitConversion::updateOrCreate(
            ['organization_id' => $org->id, 'product_variant_id' => $tileVariant->id, 'from_unit_id' => $boxUnit->id, 'to_unit_id' => $sqftUnit->id],
            ['multiplier' => 15.50]
        );

        // 2. Granite Slab Product
        $graniteSlab = Product::updateOrCreate(
            ['organization_id' => $org->id, 'sku' => 'BLK-GAL-SLAB-P'],
            [
                'category_id' => $graniteCat->id,
                'brand_id' => $brand->id,
                'purchase_unit_id' => $sqftUnit->id,
                'sales_unit_id' => $sqftUnit->id,
                'base_unit_id' => $sqftUnit->id,
                'name' => 'Black Galaxy Granite Slab Premium',
                'inventory_behavior' => 'SLAB',
                'tax_profile_id' => $taxProfile->id,
                'cost_price' => 200.00,
                'sale_price' => 350.00,
                'is_active' => true,
            ]
        );

        // Initial Stock Objects
        $warehouse = Warehouse::where('organization_id', $org->id)->first();
        $loc = StorageLocation::where('organization_id', $org->id)->first();
        $user = User::where('organization_id', $org->id)->first();

        if ($warehouse && $loc && $user) {
            $tileStock = InventoryObject::updateOrCreate(
                ['organization_id' => $org->id, 'object_code' => 'TILE-STOCK-001'],
                [
                    'product_variant_id' => $tileVariant->id,
                    'warehouse_id' => $warehouse->id,
                    'storage_location_id' => $loc->id,
                    'quantity' => 100.0000,
                    'batch_number' => 'BATCH-2026-T1',
                    'status' => 'AVAILABLE',
                ]
            );

            $slab1 = InventoryObject::updateOrCreate(
                ['organization_id' => $org->id, 'object_code' => 'BG001'],
                [
                    'product_variant_id' => $graniteSlab->id,
                    'warehouse_id' => $warehouse->id,
                    'storage_location_id' => $loc->id,
                    'quantity' => 1.0000,
                    'area' => 60.5000,
                    'status' => 'AVAILABLE',
                ]
            );

            GraniteSlabDetail::updateOrCreate(
                ['inventory_object_id' => $slab1->id],
                [
                    'length' => 10.00,
                    'width' => 6.05,
                    'thickness' => 20.00,
                    'finish' => 'Polished',
                    'origin' => 'Rajasthan',
                ]
            );
        }
    }
}
