<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UnitSeeder::class,                  // Global organization-independent units
            PermissionSeeder::class,            // Global permissions and permission groups
            MenuSeeder::class,                  // Global dynamic database menus
            SuperAdminSeeder::class,            // Super Admin User (smartnotification1@gmail.com)
            OrganizationAndUserSeeder::class,   // Tenant Organizations, Org Admins, Branches, Warehouses
            TaxProfileSeeder::class,            // Tax profiles
            CategorySeeder::class,              // Product categories
            BrandSeeder::class,                 // Brands
            ManufacturerSeeder::class,          // Manufacturers
            ProductSeeder::class,               // Sample Products, Attributes, Stock
        ]);
    }
}
