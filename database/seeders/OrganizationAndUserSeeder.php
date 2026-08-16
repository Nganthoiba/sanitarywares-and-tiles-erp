<?php

namespace Database\Seeders;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\PermissionGroup;
use App\Domains\Security\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OrganizationAndUserSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::updateOrCreate(
            ['code' => 'ACME001'],
            [
                'name' => 'Acme Sanitary & Tiles Ltd',
                'is_active' => true,
                'address' => '123 Industrial Estate, Mumbai, Maharashtra 400001',
                'gstin' => '27AAACA1234A1Z5',
            ]
        );

        $branch = Branch::updateOrCreate(
            ['organization_id' => $org->id, 'code' => 'BR01'],
            [
                'name' => 'Main Showroom',
                'is_active' => true,
                'address' => 'Mumbai Head Office',
            ]
        );

        $warehouse = Warehouse::updateOrCreate(
            ['organization_id' => $org->id, 'code' => 'WH01'],
            [
                'branch_id' => $branch->id,
                'name' => 'Central Warehouse',
                'type' => 'MAIN',
                'is_active' => true,
                'address' => 'Navi Mumbai',
            ]
        );

        StorageLocation::updateOrCreate(
            ['organization_id' => $org->id, 'code' => 'R1-C1-S1-B1'],
            [
                'warehouse_id' => $warehouse->id,
                'name' => 'Tile Rack A01',
                'location_type' => 'STAND',
            ]
        );

        $adminRole = Role::firstOrCreate(
            ['organization_id' => $org->id, 'slug' => 'super-admin'],
            ['name' => 'Super Administrator']
        );

        $adminUser = User::updateOrCreate(
            ['email' => 'admin@acme.com'],
            [
                'organization_id' => $org->id,
                'name' => 'Admin User',
                'password' => Hash::make('password'),
            ]
        );

        $adminUser->roles()->syncWithoutDetaching([$adminRole->id => ['organization_id' => $org->id]]);
    }
}
