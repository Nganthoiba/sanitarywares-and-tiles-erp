<?php

namespace Database\Seeders;

use App\Domains\Security\Models\Menu;
use App\Domains\Security\Models\Permission;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $perm = fn(string $slug) => Permission::where('slug', $slug)->first()?->id;

        // 1. Platform Administration (GROUP)
        $platformGroup = Menu::updateOrCreate(
            ['menu_name' => 'Platform Administration', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-shield-halved',
                'permission_id' => null,
                'order'         => 10,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/platform/organizations'],
            [
                'menu_name'     => 'Organizations',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-sitemap',
                'parent_id'     => $platformGroup->id,
                'permission_id' => $perm('platform.organizations.manage'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/platform/menus'],
            [
                'menu_name'     => 'Menu Manager',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-list-check',
                'parent_id'     => $platformGroup->id,
                'permission_id' => $perm('platform.menus.manage'),
                'order'         => 3,
                'enabled'       => true,
            ]
        );

        // 2. Purchases (GROUP)
        $purchasesGroup = Menu::updateOrCreate(
            ['menu_name' => 'Purchases', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-cart-shopping',
                'permission_id' => null,
                'order'         => 20,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/purchase-orders/index'],
            [
                'menu_name'     => 'Purchase Orders',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-file-invoice-dollar',
                'parent_id'     => $purchasesGroup->id,
                'permission_id' => $perm('purchase.orders.view'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/purchase-orders/new'],
            [
                'menu_name'     => 'New Purchase Order',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-plus',
                'parent_id'     => $purchasesGroup->id,
                'permission_id' => $perm('purchase.orders.create'),
                'order'         => 2,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/grn'],
            [
                'menu_name'     => 'Goods Receipt (GRN)',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-truck-ramp-box',
                'parent_id'     => $purchasesGroup->id,
                'permission_id' => $perm('purchase.requisitions.manage'),
                'order'         => 3,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/suppliers'],
            [
                'menu_name'     => 'Suppliers',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-truck-field',
                'parent_id'     => $purchasesGroup->id,
                'permission_id' => $perm('purchase.orders.view'),
                'order'         => 4,
                'enabled'       => true,
            ]
        );

        // 3. Inventory (GROUP)
        $inventoryGroup = Menu::updateOrCreate(
            ['menu_name' => 'Inventory', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-boxes-stacked',
                'permission_id' => null,
                'order'         => 30,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/inventory'],
            [
                'menu_name'     => 'Stock Manager',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-cubes',
                'parent_id'     => $inventoryGroup->id,
                'permission_id' => $perm('inventory.stock.view'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/branches'],
            [
                'menu_name'     => 'Branch Locations',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-code-branch',
                'parent_id'     => $inventoryGroup->id,
                'permission_id' => $perm('master.branches.manage'),
                'order'         => 2,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/warehouses'],
            [
                'menu_name'     => 'Warehouses',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-warehouse',
                'parent_id'     => $inventoryGroup->id,
                'permission_id' => $perm('master.warehouses.manage'),
                'order'         => 3,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/storage-locations'],
            [
                'menu_name'     => 'Storage Locations',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-map-pin',
                'parent_id'     => $inventoryGroup->id,
                'permission_id' => $perm('master.warehouses.manage'),
                'order'         => 4,
                'enabled'       => true,
            ]
        );

        // 4. Products (GROUP)
        $productsGroup = Menu::updateOrCreate(
            ['menu_name' => 'Products', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-box-archive',
                'permission_id' => null,
                'order'         => 40,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/catalog'],
            [
                'menu_name'     => 'Product Catalog',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-cube',
                'parent_id'     => $productsGroup->id,
                'permission_id' => $perm('products.view'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/categories'],
            [
                'menu_name'     => 'Categories',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-sitemap',
                'parent_id'     => $productsGroup->id,
                'permission_id' => $perm('products.categories.view'),
                'order'         => 2,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/pricing-packaging'],
            [
                'menu_name'     => 'Pricing & Packaging',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-tags',
                'parent_id'     => $productsGroup->id,
                'permission_id' => $perm('products.pricing.manage'),
                'order'         => 3,
                'enabled'       => true,
            ]
        );

        // 5. Finance (GROUP)
        $financeGroup = Menu::updateOrCreate(
            ['menu_name' => 'Finance', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-calculator',
                'permission_id' => null,
                'order'         => 50,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/bookkeeping'],
            [
                'menu_name'     => 'General Bookkeeping',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-book',
                'parent_id'     => $financeGroup->id,
                'permission_id' => $perm('accounting.accounts.manage'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        // 6. Reports (GROUP)
        $reportsGroup = Menu::updateOrCreate(
            ['menu_name' => 'Reports', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-chart-pie',
                'permission_id' => null,
                'order'         => 60,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/reporting'],
            [
                'menu_name'     => 'Reporting & BI Hub',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-chart-line',
                'parent_id'     => $reportsGroup->id,
                'permission_id' => $perm('inventory.stock.view'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        // 7. Manufacturer and Brand (GROUP)
        $manufacturerAndBrandGroup = Menu::updateOrCreate(
            ['menu_name' => 'Manufacturer and Brand', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa fa-hand-holding-heart',
                'permission_id' => null,
                'order'         => 5,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/brands'],
            [
                'menu_name'     => 'Brands',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-tags',
                'parent_id'     => $manufacturerAndBrandGroup->id,
                'permission_id' => $perm('products.brands.manage'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/manufacturers'],
            [
                'menu_name'     => 'Manufacturers',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-industry',
                'parent_id'     => $manufacturerAndBrandGroup->id,
                'permission_id' => $perm('products.manufacturers.manage'),
                'order'         => 2,
                'enabled'       => true,
            ]
        );

        // 8. System Administration (GROUP)
        $systemGroup = Menu::updateOrCreate(
            ['menu_name' => 'System Administration', 'parent_id' => null],
            [
                'menu_type'     => 'GROUP',
                'route_uri'     => null,
                'icon'          => 'fa-solid fa-gears',
                'permission_id' => null,
                'order'         => 70,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/users'],
            [
                'menu_name'     => 'User Management',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-users',
                'parent_id'     => $systemGroup->id,
                'permission_id' => $perm('master.users.manage'),
                'order'         => 1,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/platform/permissions'],
            [
                'menu_name'     => 'Permissions',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-key',
                'parent_id'     => $systemGroup->id,
                'permission_id' => $perm('platform.permissions.manage'),
                'order'         => 2,
                'enabled'       => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/roles'],
            [
                'menu_name'     => 'Role Permission Management',
                'menu_type'     => 'PAGE',
                'icon'          => 'fa-solid fa-user-shield',
                'parent_id'     => $systemGroup->id,
                'permission_id' => $perm('master.users.manage'),
                'order'         => 2,
                'enabled'       => true,
            ]
        );
    }
}
