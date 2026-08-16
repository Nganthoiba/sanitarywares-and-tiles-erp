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
            UnitSeeder::class,                  // Global organization-independent units
            OrganizationAndUserSeeder::class,   // Tenants, Users, Roles, Warehouses
            TaxProfileSeeder::class,            // Tax profiles
            CategorySeeder::class,              // Product categories
            BrandSeeder::class,                 // Brands
            ManufacturerSeeder::class,          // Manufacturers
            ProductSeeder::class,               // Sample Products, Attributes, Stock
        ]);
    }
}
