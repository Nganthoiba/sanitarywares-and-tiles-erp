<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\ProductAttribute;
use Illuminate\Support\Facades\DB;

class CategorySpecificationSeeder extends Seeder
{
    public function run(): void
    {
        $ftUnit = Unit::whereIn('symbol', ['FT', 'ft', 'Feet', 'sq.ft.'])->first();
        $kgUnit = Unit::whereIn('symbol', ['KG', 'kg', 'Kg'])->first();

        // 1. Seed Global Attributes
        $attributesData = [
            'tile-size' => [
                'name' => 'Tile Size',
                'slug' => 'tile-size',
                'type' => 'selection',
                'unit_id' => null,
            ],
            'length' => [
                'name' => 'Length',
                'slug' => 'length',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'width' => [
                'name' => 'Width',
                'slug' => 'width',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'thickness' => [
                'name' => 'Thickness',
                'slug' => 'thickness',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'thickness-unit' => [
                'name' => 'Thickness Unit',
                'slug' => 'thickness-unit',
                'type' => 'string',
                'unit_id' => null,
            ],
            'dimension-unit' => [
                'name' => 'Dimension Unit',
                'slug' => 'dimension-unit',
                'type' => 'string',
                'unit_id' => null,
            ],
            'length-mm' => [
                'name' => 'Normalized Length (mm)',
                'slug' => 'length-mm',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'width-mm' => [
                'name' => 'Normalized Width (mm)',
                'slug' => 'width-mm',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'coverage-area-sqft' => [
                'name' => 'Tile Area (Sq.Ft.)',
                'slug' => 'coverage-area-sqft',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'coverage-area-sqm' => [
                'name' => 'Tile Area (Sq.M.)',
                'slug' => 'coverage-area-sqm',
                'type' => 'decimal',
                'unit_id' => null,
            ],
            'net-weight' => [
                'name' => 'Net Weight',
                'slug' => 'net-weight',
                'type' => 'decimal',
                'unit_id' => $kgUnit?->id,
            ],
            'colour' => [
                'name' => 'Colour',
                'slug' => 'colour',
                'type' => 'selection',
                'unit_id' => null,
            ],
            'material' => [
                'name' => 'Material',
                'slug' => 'material',
                'type' => 'selection',
                'unit_id' => null,
            ],
            'installation-type' => [
                'name' => 'Installation Type',
                'slug' => 'installation-type',
                'type' => 'selection',
                'unit_id' => null,
            ],
            'finish' => [
                'name' => 'Finish',
                'slug' => 'finish',
                'type' => 'selection',
                'unit_id' => null,
            ],
        ];

        $attributesMap = [];
        foreach ($attributesData as $slug => $data) {
            $attributesMap[$slug] = ProductAttribute::withoutGlobalScopes()->updateOrCreate(
                [
                    'slug' => $slug,
                    'organization_id' => null,
                ],
                array_merge($data, ['organization_id' => null])
            );
        }

        // 2. Map Category Specifications
        $categoryMappings = [
            'tiles' => [
                [
                    'attribute_slug' => 'tile-size',
                    'is_required' => true,
                    'sort_order' => 1,
                    'allowed_values' => ['60 × 60 cm', '30 × 60 cm', '600 × 1200 mm', '2 × 2 ft', '2 × 4 ft', '12 × 24 in', 'Custom Size'],
                ],
                [
                    'attribute_slug' => 'length',
                    'is_required' => true,
                    'sort_order' => 2,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'width',
                    'is_required' => true,
                    'sort_order' => 3,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'thickness',
                    'is_required' => false,
                    'sort_order' => 4,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'thickness-unit',
                    'is_required' => false,
                    'sort_order' => 5,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'dimension-unit',
                    'is_required' => false,
                    'sort_order' => 6,
                    'allowed_values' => null,
                ],
            ],
            'granite-slabs' => [
                [
                    'attribute_slug' => 'length',
                    'is_required' => true,
                    'sort_order' => 1,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'width',
                    'is_required' => true,
                    'sort_order' => 2,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'thickness',
                    'is_required' => false,
                    'sort_order' => 3,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'thickness-unit',
                    'is_required' => false,
                    'sort_order' => 4,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'dimension-unit',
                    'is_required' => false,
                    'sort_order' => 5,
                    'allowed_values' => null,
                ],
            ],
            'marble-slabs' => [
                [
                    'attribute_slug' => 'length',
                    'is_required' => true,
                    'sort_order' => 1,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'width',
                    'is_required' => true,
                    'sort_order' => 2,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'thickness',
                    'is_required' => false,
                    'sort_order' => 3,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'thickness-unit',
                    'is_required' => false,
                    'sort_order' => 4,
                    'allowed_values' => null,
                ],
                [
                    'attribute_slug' => 'dimension-unit',
                    'is_required' => false,
                    'sort_order' => 5,
                    'allowed_values' => null,
                ],
            ],
            'tile-adhesive-grout' => [
                [
                    'attribute_slug' => 'net-weight',
                    'is_required' => true,
                    'sort_order' => 1,
                    'allowed_values' => null,
                ],
            ],
            'sanitaryware' => [
                [
                    'attribute_slug' => 'colour',
                    'is_required' => false,
                    'sort_order' => 1,
                    'allowed_values' => ['White', 'Ivory', 'Black', 'Matt Black', 'Grey', 'Beige', 'Terracotta'],
                ],
                [
                    'attribute_slug' => 'material',
                    'is_required' => false,
                    'sort_order' => 2,
                    'allowed_values' => ['Ceramic', 'Vitreous China', 'Porcelain', 'Stainless Steel'],
                ],
                [
                    'attribute_slug' => 'installation-type',
                    'is_required' => false,
                    'sort_order' => 3,
                    'allowed_values' => ['Wall Hung', 'Floor Mounted', 'Counter Top', 'Table Top', 'Under Counter'],
                ],
            ],
            'cp-fittings' => [
                [
                    'attribute_slug' => 'finish',
                    'is_required' => false,
                    'sort_order' => 1,
                    'allowed_values' => ['Chrome', 'Matt Black', 'Rose Gold', 'Brushed Nickel'],
                ],
                [
                    'attribute_slug' => 'material',
                    'is_required' => false,
                    'sort_order' => 2,
                    'allowed_values' => ['Brass', 'Stainless Steel', 'ABS'],
                ],
            ],
        ];

        foreach ($categoryMappings as $catSlug => $specs) {
            $category = Category::withoutGlobalScopes()->where('slug', $catSlug)->first();
            if (!$category) {
                continue;
            }

            foreach ($specs as $spec) {
                $attr = $attributesMap[$spec['attribute_slug']] ?? null;
                if (!$attr) {
                    continue;
                }

                DB::table('category_product_attributes')->updateOrInsert(
                    [
                        'category_id' => $category->id,
                        'product_attribute_id' => $attr->id,
                    ],
                    [
                        'is_required' => $spec['is_required'],
                        'sort_order' => $spec['sort_order'],
                        'allowed_values' => $spec['allowed_values'] ? json_encode($spec['allowed_values']) : null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
