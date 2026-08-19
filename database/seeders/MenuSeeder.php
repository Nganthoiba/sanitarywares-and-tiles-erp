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

        // Platform Administration Group
        Menu::updateOrCreate(
            ['route_uri' => '/platform/organizations'],
            [
                'menu_name' => 'Organizations',
                'icon' => 'fa-solid fa-sitemap',
                'group_name' => 'Platform Administration',
                'permission_id' => $perm('platform.organizations.manage'),
                'order' => 10,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/platform/permissions'],
            [
                'menu_name' => 'Permissions',
                'icon' => 'fa-solid fa-key',
                'group_name' => 'Platform Administration',
                'permission_id' => $perm('platform.permissions.manage'),
                'order' => 20,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/platform/menus'],
            [
                'menu_name' => 'Menu Manager',
                'icon' => 'fa-solid fa-list-check',
                'group_name' => 'Platform Administration',
                'permission_id' => $perm('platform.menus.manage'),
                'order' => 30,
                'enabled' => true,
            ]
        );

        // Core Operations Group
        Menu::updateOrCreate(
            ['route_uri' => '/inventory'],
            [
                'menu_name' => 'Inventory Engine',
                'icon' => 'fa-solid fa-boxes-stacked',
                'group_name' => 'Operations',
                'permission_id' => $perm('inventory.stock.view'),
                'order' => 100,
                'enabled' => true,
            ]
        );

        $grnParent = Menu::updateOrCreate(
            ['route_uri' => '/grn'],
            [
                'menu_name' => 'Goods Receipt (GRN)',
                'icon' => 'fa-solid fa-file-invoice',
                'group_name' => 'Operations',
                'permission_id' => $perm('purchase.requisitions.manage'),
                'order' => 110,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/grn/new'],
            [
                'menu_name' => 'New GRN Note',
                'icon' => 'fa-solid fa-plus',
                'group_name' => 'Operations',
                'parent_id' => $grnParent->id,
                'permission_id' => $perm('purchase.requisitions.manage'),
                'order' => 2,
                'enabled' => true,
            ]
        );

        $poParent = Menu::updateOrCreate(
            ['route_uri' => '/purchase-orders'],
            [
                'menu_name' => 'Purchase Orders',
                'icon' => 'fa-solid fa-cart-shopping',
                'group_name' => 'Operations',
                'permission_id' => $perm('purchase.orders.view'),
                'order' => 120,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/purchase-orders/new'],
            [
                'menu_name' => 'New Purchase Order',
                'icon' => 'fa-solid fa-plus',
                'group_name' => 'Operations',
                'parent_id' => $poParent->id,
                'permission_id' => $perm('purchase.orders.create'),
                'order' => 2,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/branches'],
            [
                'menu_name' => 'Branch Locations',
                'icon' => 'fa-solid fa-code-branch',
                'group_name' => 'Master Data',
                'permission_id' => $perm('master.branches.manage'),
                'order' => 130,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/warehouses'],
            [
                'menu_name' => 'Warehouses',
                'icon' => 'fa-solid fa-warehouse',
                'group_name' => 'Master Data',
                'permission_id' => $perm('master.warehouses.manage'),
                'order' => 140,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/storage-locations'],
            [
                'menu_name' => 'Storage Locations',
                'icon' => 'fa-solid fa-map-pin',
                'group_name' => 'Master Data',
                'permission_id' => $perm('master.warehouses.manage'),
                'order' => 150,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/suppliers'],
            [
                'menu_name' => 'Suppliers',
                'icon' => 'fa-solid fa-truck-field',
                'group_name' => 'Master Data',
                'permission_id' => $perm('purchase.orders.view'),
                'order' => 160,
                'enabled' => true,
            ]
        );

        $prodParent = Menu::updateOrCreate(
            ['route_uri' => '/products'],
            [
                'menu_name' => 'Products',
                'icon' => 'fa-solid fa-cube',
                'group_name' => 'Master Data',
                'permission_id' => $perm('products.view'),
                'order' => 170,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/categories'],
            [
                'menu_name' => 'Categories',
                'icon' => 'fa-solid fa-sitemap',
                'group_name' => 'Master Data',
                'parent_id' => $prodParent->id,
                'permission_id' => $perm('products.view'),
                'order' => 2,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/brands'],
            [
                'menu_name' => 'Brands',
                'icon' => 'fa-solid fa-tags',
                'group_name' => 'Master Data',
                'permission_id' => $perm('products.brands.manage'),
                'order' => 180,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/products/manufacturers'],
            [
                'menu_name' => 'Manufacturers',
                'icon' => 'fa-solid fa-industry',
                'group_name' => 'Master Data',
                'permission_id' => $perm('products.manufacturers.manage'),
                'order' => 190,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/workflows'],
            [
                'menu_name' => 'BPM Workflows',
                'icon' => 'fa-solid fa-diagram-project',
                'group_name' => 'System',
                'permission_id' => $perm('workflow.definition.manage'),
                'order' => 200,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/bookkeeping'],
            [
                'menu_name' => 'General Bookkeeping',
                'icon' => 'fa-solid fa-calculator',
                'group_name' => 'Finance',
                'permission_id' => $perm('accounting.accounts.manage'),
                'order' => 210,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/reporting'],
            [
                'menu_name' => 'Reporting & BI Hub',
                'icon' => 'fa-solid fa-chart-line',
                'group_name' => 'Reports',
                'permission_id' => $perm('inventory.stock.view'),
                'order' => 220,
                'enabled' => true,
            ]
        );

        Menu::updateOrCreate(
            ['route_uri' => '/users'],
            [
                'menu_name' => 'User & Role Manager',
                'icon' => 'fa-solid fa-users-gear',
                'group_name' => 'Administration',
                'permission_id' => $perm('master.users.manage'),
                'order' => 230,
                'enabled' => true,
            ]
        );
    }
}
