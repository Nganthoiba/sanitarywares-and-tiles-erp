<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        if (!$org) return;

        $categories = [
            ['name' => 'Ceramic Tiles', 'slug' => 'ceramic-tiles', 'is_active' => true],
            ['name' => 'GVT / PGVT Vitrified Tiles', 'slug' => 'vitrified-tiles', 'is_active' => true],
            ['name' => 'Granite Slabs', 'slug' => 'granite-slabs', 'is_active' => true],
            ['name' => 'Italian Marble', 'slug' => 'italian-marble', 'is_active' => true],
            ['name' => 'CP Fittings & Faucets', 'slug' => 'cp-fittings', 'is_active' => true],
            ['name' => 'Sanitaryware', 'slug' => 'sanitaryware', 'is_active' => true],
            ['name' => 'Tile Adhesive & Grout', 'slug' => 'tile-adhesive-grout', 'is_active' => true],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['organization_id' => $org->id, 'slug' => $cat['slug']],
                $cat
            );
        }
    }
}
