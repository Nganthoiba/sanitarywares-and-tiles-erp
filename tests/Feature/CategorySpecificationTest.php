<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;
use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;

class CategorySpecificationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Organization $org;
    protected Brand $brand;
    protected Unit $boxUnit;
    protected Unit $sqftUnit;
    protected TaxProfile $taxProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::first();
        $this->user = User::where('organization_id', $this->org->id)->first() ?? User::factory()->create(['organization_id' => $this->org->id]);

        $this->brand = Brand::where('organization_id', $this->org->id)->first() ?? Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Kajaria',
            'slug' => 'kajaria'
        ]);

        $this->boxUnit = Unit::whereIn('symbol', ['BOX', 'box'])->first() ?? Unit::first();
        $this->sqftUnit = Unit::whereIn('symbol', ['SQFT', 'sq.ft.', 'ft'])->first() ?? Unit::first();
        $this->taxProfile = TaxProfile::first();
    }

    /** @test */
    public function category_specifications_api_returns_configured_attributes()
    {
        $tilesCategory = Category::where('slug', 'tiles')->first();
        $this->assertNotNull($tilesCategory);

        $response = $this->actingAs($this->user)->getJson("/api/categories/{$tilesCategory->id}/specifications");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'category_id',
                'category_name',
                'category_slug',
                'specifications' => [
                    '*' => [
                        'attribute_id',
                        'name',
                        'slug',
                        'type',
                        'unit_symbol',
                        'is_required',
                        'sort_order',
                        'allowed_values'
                    ]
                ]
            ]);

        $slugs = collect($response->json('specifications'))->pluck('slug')->toArray();
        $this->assertContains('tile-size', $slugs);
        $this->assertContains('length', $slugs);
        $this->assertContains('width', $slugs);
    }

    /** @test */
    public function subcategory_inherits_parent_category_specifications()
    {
        $ceramicSubCategory = Category::where('slug', 'ceramic-tiles')->first();
        $this->assertNotNull($ceramicSubCategory);

        $response = $this->actingAs($this->user)->getJson("/api/categories/{$ceramicSubCategory->id}/specifications");

        $response->assertStatus(200);
        $slugs = collect($response->json('specifications'))->pluck('slug')->toArray();
        $this->assertContains('tile-size', $slugs);
        $this->assertContains('length', $slugs);
        $this->assertContains('width', $slugs);
    }

    /** @test */
    public function product_variant_can_be_created_with_category_specifications_without_manual_attribute_builder()
    {
        $tilesCategory = Category::where('slug', 'tiles')->first();
        $tileSizeAttr = ProductAttribute::where('slug', 'tile-size')->first();
        $lengthAttr = ProductAttribute::where('slug', 'length')->first();
        $widthAttr = ProductAttribute::where('slug', 'width')->first();

        $payload = [
            'category_id' => $tilesCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria Royal Gold 2x4 ft',
            'sku' => 'KAJ-ROY-2X4-TEST',
            'product_type' => 'STANDARD',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true,
            'attributes' => [
                $tileSizeAttr->id => '2 × 4 ft',
                $lengthAttr->id => '2',
                $widthAttr->id => '4',
            ]
        ];

        $response = $this->actingAs($this->user)->postJson('/api/product/variants', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $variantId = $response->json('data.id');
        $this->assertDatabaseHas('product_variants', [
            'id' => $variantId,
            'name' => 'Kajaria Royal Gold 2x4 ft',
            'sku' => 'KAJ-ROY-2X4-TEST'
        ]);

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $variantId,
            'product_attribute_id' => $tileSizeAttr->id,
            'value' => '2 × 4 ft'
        ]);

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $variantId,
            'product_attribute_id' => $lengthAttr->id,
            'value' => '2'
        ]);

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $variantId,
            'product_attribute_id' => $widthAttr->id,
            'value' => '4'
        ]);
    }

    /** @test */
    public function backend_enforces_required_category_specifications()
    {
        $tilesCategory = Category::where('slug', 'tiles')->first();

        // Omit required attributes
        $payload = [
            'category_id' => $tilesCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Incomplete Tile Variant',
            'sku' => 'TILE-INC-001',
            'product_type' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'attributes' => []
        ];

        $response = $this->actingAs($this->user)->postJson('/api/product/variants', $payload);

        $response->assertStatus(422);
    }

    /** @test */
    public function backend_validates_positive_numeric_dimensions()
    {
        $graniteCategory = Category::where('slug', 'granite-slabs')->first();
        $lengthAttr = ProductAttribute::where('slug', 'length')->first();
        $widthAttr = ProductAttribute::where('slug', 'width')->first();

        $payload = [
            'category_id' => $graniteCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Black Galaxy Granite Slab',
            'sku' => 'GRAN-BLK-001',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'attributes' => [
                $lengthAttr->id => '-5', // Invalid negative length
                $widthAttr->id => '4',
            ]
        ];

        $response = $this->actingAs($this->user)->postJson('/api/product/variants', $payload);

        $response->assertStatus(422);
    }

    /** @test */
    public function granite_slab_stores_normalized_length_and_width()
    {
        $graniteCategory = Category::where('slug', 'granite-slabs')->first();
        $lengthAttr = ProductAttribute::where('slug', 'length')->first();
        $widthAttr = ProductAttribute::where('slug', 'width')->first();

        $payload = [
            'category_id' => $graniteCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Black Galaxy Premium Granite 8x4',
            'sku' => 'GRAN-BLK-8X4',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'attributes' => [
                $lengthAttr->id => '8',
                $widthAttr->id => '4',
            ]
        ];

        $response = $this->actingAs($this->user)->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $variantId = $response->json('data.id');

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $variantId,
            'product_attribute_id' => $lengthAttr->id,
            'value' => '8'
        ]);

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $variantId,
            'product_attribute_id' => $widthAttr->id,
            'value' => '4'
        ]);
    }

    /** @test */
    public function adhesive_category_stores_weight_specification()
    {
        $adhesiveCategory = Category::where('slug', 'tile-adhesive-grout')->first();
        $weightAttr = ProductAttribute::where('slug', 'net-weight')->first();

        $payload = [
            'category_id' => $adhesiveCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Roff Tile Adhesive 20 KG',
            'sku' => 'ROFF-ADH-20KG',
            'product_type' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'attributes' => [
                $weightAttr->id => '20',
            ]
        ];

        $response = $this->actingAs($this->user)->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $variantId = $response->json('data.id');

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $variantId,
            'product_attribute_id' => $weightAttr->id,
            'value' => '20'
        ]);
    }

    /** @test */
    public function server_derives_inventory_behavior_and_product_type_from_category_when_omitted()
    {
        $graniteCategory = Category::where('slug', 'granite-slabs')->first();
        $lengthAttr = ProductAttribute::where('slug', 'length')->first();
        $widthAttr = ProductAttribute::where('slug', 'width')->first();

        // Omit product_type and inventory_behavior
        $payload = [
            'category_id' => $graniteCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Auto Derived Granite Slab 10x5',
            'sku' => 'AUTO-GRAN-10X5',
            'attributes' => [
                $lengthAttr->id => '10',
                $widthAttr->id => '5',
            ]
        ];

        $response = $this->actingAs($this->user)->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $variantId = $response->json('data.id');

        $this->assertDatabaseHas('product_variants', [
            'id' => $variantId,
            'inventory_behavior' => 'SLAB'
        ]);

        $tilesCategory = Category::where('slug', 'tiles')->first();
        $tileSizeAttr = ProductAttribute::where('slug', 'tile-size')->first();

        // Omit product_type and inventory_behavior for Tiles
        $payloadTile = [
            'category_id' => $tilesCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Auto Derived Tile 2x2',
            'sku' => 'AUTO-TILE-2X2',
            'attributes' => [
                $tileSizeAttr->id => '2 × 2 ft',
                $lengthAttr->id => '2',
                $widthAttr->id => '2',
            ]
        ];

        $responseTile = $this->actingAs($this->user)->postJson('/api/product/variants', $payloadTile);

        $responseTile->assertStatus(201);
        $tileVariantId = $responseTile->json('data.id');

        $this->assertDatabaseHas('product_variants', [
            'id' => $tileVariantId,
            'inventory_behavior' => 'STANDARD'
        ]);
    }
}
