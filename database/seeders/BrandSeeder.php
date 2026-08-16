<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        if (!$org) return;

        $brands = [
            ['name' => 'Kajaria Ceramics', 'slug' => 'kajaria', 'is_active' => true],
            ['name' => 'Somany Ceramics', 'slug' => 'somany', 'is_active' => true],
            ['name' => 'Asian Granito', 'slug' => 'asian-granito', 'is_active' => true],
            ['name' => 'Jaquar', 'slug' => 'jaquar', 'is_active' => true],
            ['name' => 'Hindware', 'slug' => 'hindware', 'is_active' => true],
            ['name' => 'Kohler', 'slug' => 'kohler', 'is_active' => true],
            ['name' => 'Cera', 'slug' => 'cera', 'is_active' => true],
            ['name' => 'Roff Adhesive', 'slug' => 'roff', 'is_active' => true],
        ];

        foreach ($brands as $b) {
            Brand::updateOrCreate(
                ['organization_id' => $org->id, 'slug' => $b['slug']],
                $b
            );
        }
    }
}
