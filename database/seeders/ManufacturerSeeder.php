<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Manufacturer;
use Illuminate\Database\Seeder;

class ManufacturerSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        if (!$org) return;

        $manufacturers = [
            ['name' => 'Kajaria Ceramics Ltd'],
            ['name' => 'Somany Ceramics Ltd'],
            ['name' => 'Jaquar & Company Pvt Ltd'],
        ];

        foreach ($manufacturers as $m) {
            Manufacturer::updateOrCreate(
                ['organization_id' => $org->id, 'name' => $m['name']],
                $m
            );
        }
    }
}
