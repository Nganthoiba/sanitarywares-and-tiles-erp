<?php

namespace Tests\Feature;

use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TilePiecesPerBoxTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Category $tileCategory;
    protected Category $ceramicSubCategory;
    protected Category $graniteCategory;
    protected Brand $brand;
    protected TaxProfile $taxProfile;
    protected Unit $pcsUnit;
    protected Unit $boxUnit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'name' => 'Test Tile ERP Org',
            'code' => 'TEST_ORG',
            'is_active' => true,
        ]);

        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Admin User',
            'email' => 'admin_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $this->tileCategory = Category::create([
            'organization_id' => null,
            'name' => 'Tiles',
            'slug' => 'tiles',
            'is_active' => true,
        ]);

        $this->ceramicSubCategory = Category::create([
            'organization_id' => null,
            'parent_id' => $this->tileCategory->id,
            'name' => 'Ceramic Tiles',
            'slug' => 'ceramic-tiles',
            'is_active' => true,
        ]);

        $this->graniteCategory = Category::create([
            'organization_id' => null,
            'name' => 'Granite Slabs',
            'slug' => 'granite-slabs',
            'is_active' => true,
        ]);

        $this->brand = Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Kajaria',
            'slug' => 'kajaria',
            'is_active' => true,
        ]);

        $this->taxProfile = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'rate' => 18.00,
            'is_active' => true,
        ]);

        $this->pcsUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Pieces',
            'symbol' => 'PCS',
            'is_active' => true,
        ]);

        $this->boxUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Boxes',
            'symbol' => 'BOX',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_can_store_pieces_per_box_for_tile_products()
    {
        $response = $this->actingAs($this->user)->postJson('/api/product/variants', [
            'category_id' => $this->ceramicSubCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria Oasis Beige 600x600',
            'sku' => 'KAJ-OASIS-600',
            'pieces_per_box' => 4,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.pieces_per_box', 4);

        $this->assertDatabaseHas('product_variants', [
            'sku' => 'KAJ-OASIS-600',
            'pieces_per_box' => 4,
        ]);
    }

    /** @test */
    public function it_rejects_zero_pieces_per_box_for_tile_products()
    {
        $response = $this->actingAs($this->user)->postJson('/api/product/variants', [
            'category_id' => $this->ceramicSubCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria Invalid Zero',
            'sku' => 'KAJ-ZERO',
            'pieces_per_box' => 0,
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    /** @test */
    public function it_rejects_negative_pieces_per_box()
    {
        $response = $this->actingAs($this->user)->postJson('/api/product/variants', [
            'category_id' => $this->tileCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria Negative Test',
            'sku' => 'KAJ-NEG',
            'pieces_per_box' => -4,
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_rejects_decimal_pieces_per_box()
    {
        $response = $this->actingAs($this->user)->postJson('/api/product/variants', [
            'category_id' => $this->tileCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria Decimal Test',
            'sku' => 'KAJ-DEC',
            'pieces_per_box' => 4.5,
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_rejects_string_pieces_per_box()
    {
        $response = $this->actingAs($this->user)->postJson('/api/product/variants', [
            'category_id' => $this->tileCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria String Test',
            'sku' => 'KAJ-STR',
            'pieces_per_box' => 'four',
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function non_tile_categories_do_not_store_pieces_per_box()
    {
        $response = $this->actingAs($this->user)->postJson('/api/product/variants', [
            'category_id' => $this->graniteCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Black Galaxy Granite Slab',
            'sku' => 'GRN-BLK-GAL',
            'pieces_per_box' => 4, // submitted by mistake for granite slab
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.pieces_per_box', null);

        $this->assertDatabaseHas('product_variants', [
            'sku' => 'GRN-BLK-GAL',
            'pieces_per_box' => null,
        ]);
    }

    /** @test */
    public function domain_helper_methods_calculate_conversions_correctly()
    {
        $tile = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->tileCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Somany Duragres Vitrified 600x1200',
            'sku' => 'SOM-60120',
            'pieces_per_box' => 4,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true,
        ]);

        // 1 BOX = 4 PCS. 10 BOXES = 40 PCS
        $this->assertEquals(40, $tile->calculatePiecesFromBoxes(10));

        // 40 PCS / 4 = 10 BOXES
        $this->assertEquals(10.0, $tile->calculateBoxesFromPieces(40));

        // If 1 tile piece area = 8 sq.ft, 1 box (4 pcs) = 32 sq.ft
        $this->assertEquals(32.0, $tile->calculateAreaPerBox(8.0));
    }

    /** @test */
    public function changing_category_away_from_tiles_clears_pieces_per_box()
    {
        $tile = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->ceramicSubCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Convertible Tile Variant',
            'sku' => 'CNV-001',
            'pieces_per_box' => 6,
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true,
        ]);

        $this->assertEquals(6, $tile->pieces_per_box);

        $response = $this->actingAs($this->user)->putJson("/api/product/variants/{$tile->id}", [
            'category_id' => $this->graniteCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Convertible Tile Variant',
            'sku' => 'CNV-001',
            'inventory_behavior' => 'SLAB',
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.pieces_per_box', null);

        $this->assertDatabaseHas('product_variants', [
            'id' => $tile->id,
            'pieces_per_box' => null,
        ]);
    }
}
