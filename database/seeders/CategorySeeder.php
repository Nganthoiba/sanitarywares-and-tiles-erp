<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Global Root Categories and Sub-categories (organization_id is null)
        $categoriesTree = [
            [
                'name' => 'Tiles',
                'slug' => 'tiles',
                'description' => 'Floor, wall, ceramic, and vitrified tiles catalog.',
                'sort_order' => 1,
                'is_active' => true,
                'subcategories' => [
                    [
                        'name' => 'Ceramic Tiles',
                        'slug' => 'ceramic-tiles',
                        'description' => 'Ceramic wall and floor tiles.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                    [
                        'name' => 'GVT / PGVT Vitrified Tiles',
                        'slug' => 'vitrified-tiles',
                        'description' => 'Glazed & Polished Glazed Vitrified Tiles.',
                        'sort_order' => 2,
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Double Charge Vitrified Tiles',
                        'slug' => 'double-charge-tiles',
                        'description' => 'Heavy duty double charge vitrified tiles.',
                        'sort_order' => 3,
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Wall & Body Tiles',
                        'slug' => 'wall-tiles',
                        'description' => 'Decorative wall and body ceramic tiles.',
                        'sort_order' => 4,
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Parking & Outdoor Tiles',
                        'slug' => 'outdoor-tiles',
                        'description' => 'Heavy duty outdoor paver tiles.',
                        'sort_order' => 5,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'name' => 'Granite Slabs',
                'slug' => 'granite-slabs',
                'description' => 'Natural granite slabs measured and priced per square foot.',
                'sort_order' => 2,
                'is_active' => true,
                'subcategories' => [],
            ],
            [
                'name' => 'Marble Slabs',
                'slug' => 'marble-slabs',
                'description' => 'Indian and imported Italian marble slabs.',
                'sort_order' => 3,
                'is_active' => true,
                'subcategories' => [],
            ],
            [
                'name' => 'CP Fittings & Faucets',
                'slug' => 'cp-fittings',
                'description' => 'Chromium plated bathroom fittings, faucets, and showers.',
                'sort_order' => 4,
                'is_active' => true,
                'subcategories' => [],
            ],
            [
                'name' => 'Sanitaryware',
                'slug' => 'sanitaryware',
                'description' => 'Water closets, wash basins, urinals, and cisterns.',
                'sort_order' => 5,
                'is_active' => true,
                'subcategories' => [],
            ],
            [
                'name' => 'Tile Adhesive & Grout',
                'slug' => 'tile-adhesive-grout',
                'description' => 'Polymer modified tile adhesives, epoxy grouts, and cleaners.',
                'sort_order' => 6,
                'is_active' => true,
                'subcategories' => [],
            ],
        ];

        foreach ($categoriesTree as $rootData) {
            $subcategories = $rootData['subcategories'];
            unset($rootData['subcategories']);

            $rootCategory = Category::withoutGlobalScopes()->updateOrCreate(
                [
                    'slug' => $rootData['slug'],
                    'organization_id' => null,
                ],
                array_merge($rootData, [
                    'organization_id' => null,
                    'parent_id' => null,
                ])
            );

            foreach ($subcategories as $subData) {
                Category::withoutGlobalScopes()->updateOrCreate(
                    [
                        'slug' => $subData['slug'],
                        'organization_id' => null,
                    ],
                    array_merge($subData, [
                        'organization_id' => null,
                        'parent_id' => $rootCategory->id,
                    ])
                );
            }
        }
    }
}
