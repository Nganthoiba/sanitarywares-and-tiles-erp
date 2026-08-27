<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductAttributeTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Category $category;
    protected Brand $brand;
    protected TaxProfile $taxProfile;
    protected Unit $mmUnit;
    protected Unit $boxUnit;
    protected Unit $sqftUnit;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Primary Organization & User
        $this->org = Organization::create(['name' => 'Kajaria Store', 'code' => 'KAJ-STR', 'is_active' => true]);
        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Admin User',
            'email' => 'admin@kajariastore.com',
            'password' => bcrypt('password'),
        ]);

        // 2. Lookups
        $this->category = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Tiles',
            'slug' => 'tiles',
            'is_active' => true
        ]);
        $this->brand = Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Kajaria',
            'slug' => 'kajaria',
            'is_active' => true
        ]);
        $this->taxProfile = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'igst_rate' => 18,
            'cgst_rate' => 9,
            'sgst_rate' => 9,
            'is_active' => true
        ]);
        $this->mmUnit = Unit::create([
            'name' => 'Millimeter',
            'symbol' => 'MM',
            'type' => 'MEASUREMENT',
            'decimal_places' => 3
        ]);
        $this->boxUnit = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
            'decimal_places' => 0
        ]);
        $this->sqftUnit = Unit::create([
            'name' => 'Square Foot',
            'symbol' => 'SQ.FT.',
            'type' => 'MEASUREMENT',
            'decimal_places' => 3
        ]);
    }

    /** @test */
    public function test_attribute_definition_can_exist_with_or_without_unit()
    {
        // 1. Color without unit (NO UNIT)
        $colorAttr = ProductAttribute::create([
            'organization_id' => $this->org->id,
            'name' => 'Color',
            'slug' => 'color',
            'type' => 'string',
            'unit_id' => null
        ]);
        $this->assertNull($colorAttr->unit_id);
        $this->assertNull($colorAttr->unit);

        // 2. Thickness with unit (MM)
        $thicknessAttr = ProductAttribute::create([
            'organization_id' => $this->org->id,
            'name' => 'Thickness',
            'slug' => 'thickness',
            'type' => 'number',
            'unit_id' => $this->mmUnit->id
        ]);
        $this->assertEquals($this->mmUnit->id, $thicknessAttr->unit_id);
        $this->assertEquals('Millimeter', $thicknessAttr->unit->name);
    }

    /** @test */
    public function test_unit_dimension_categories()
    {
        $this->assertEquals('LENGTH', $this->mmUnit->dimension_category);
        $this->assertEquals('COUNT', $this->boxUnit->dimension_category);
        $this->assertEquals('AREA', $this->sqftUnit->dimension_category);
    }

    /** @test */
    public function test_product_can_exist_without_any_attributes()
    {
        $product = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Cleaning Cloth Accessory',
            'sku' => 'ACC-CLOTH-01',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true
        ]);

        $this->assertCount(0, $product->attributeValues);
    }

    /** @test */
    public function test_same_attribute_can_be_assigned_to_multiple_products_with_different_values()
    {
        $thicknessAttr = ProductAttribute::create([
            'organization_id' => $this->org->id,
            'name' => 'Thickness',
            'slug' => 'thickness',
            'type' => 'number',
            'unit_id' => $this->mmUnit->id
        ]);

        $productA = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Tile 600x600 A',
            'sku' => 'TILE-600-A',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true
        ]);

        $productB = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Tile 600x600 B',
            'sku' => 'TILE-600-B',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true
        ]);

        ProductAttributeValue::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $productA->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '8'
        ]);

        ProductAttributeValue::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $productB->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '10'
        ]);

        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $productA->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '8'
        ]);
        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $productB->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '10'
        ]);
    }

    /** @test */
    public function test_removing_product_attribute_does_not_delete_global_attribute_definition_or_affect_other_products()
    {
        $thicknessAttr = ProductAttribute::create([
            'organization_id' => $this->org->id,
            'name' => 'Thickness',
            'slug' => 'thickness',
            'type' => 'number',
            'unit_id' => $this->mmUnit->id
        ]);

        $productA = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Tile 600x600 A',
            'sku' => 'TILE-600-A',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true
        ]);

        $productB = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Tile 600x600 B',
            'sku' => 'TILE-600-B',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true
        ]);

        ProductAttributeValue::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $productA->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '8'
        ]);

        ProductAttributeValue::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $productB->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '10'
        ]);

        // Remove attribute assignment from Product A via API
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/products/{$productA->id}/attributes/{$thicknessAttr->id}");

        $response->assertStatus(200);

        // Product A value removed (soft deleted)
        $this->assertSoftDeleted('product_attribute_values', [
            'product_variant_id' => $productA->id,
            'product_attribute_id' => $thicknessAttr->id
        ]);

        // Product B value intact
        $this->assertDatabaseHas('product_attribute_values', [
            'product_variant_id' => $productB->id,
            'product_attribute_id' => $thicknessAttr->id,
            'value' => '10'
        ]);

        // Global Attribute Definition intact
        $this->assertDatabaseHas('product_attributes', [
            'id' => $thicknessAttr->id,
            'name' => 'Thickness'
        ]);
    }

    /** @test */
    public function test_cross_organization_attribute_assignment_is_rejected()
    {
        // Organization B & User B
        $orgB = Organization::create(['name' => 'Other Store', 'code' => 'OTH-STR', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'User B',
            'email' => 'userB@otherstore.com',
            'password' => bcrypt('password'),
        ]);

        $attrA = ProductAttribute::create([
            'organization_id' => $this->org->id,
            'name' => 'Color',
            'slug' => 'color',
            'type' => 'string'
        ]);

        $unitB = Unit::create(['name' => 'B Box', 'symbol' => 'BBOX']);

        $productB = Product::create([
            'organization_id' => $orgB->id,
            'category_id' => Category::create(['organization_id' => $orgB->id, 'name' => 'B Cat', 'slug' => 'b-cat'])->id,
            'brand_id' => Brand::create(['organization_id' => $orgB->id, 'name' => 'B Brand', 'slug' => 'b-brand'])->id,
            'name' => 'Product B',
            'sku' => 'PROD-B',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $unitB->id,
            'sales_unit_id' => $unitB->id,
            'base_unit_id' => $unitB->id,
            'tax_profile_id' => TaxProfile::create(['organization_id' => $orgB->id, 'name' => 'B Tax', 'igst_rate' => 18, 'cgst_rate' => 9, 'sgst_rate' => 9])->id,
            'is_active' => true
        ]);

        // User B attempts to assign Org A's attribute to Product B
        $response = $this->actingAs($userB)
            ->postJson("/api/products/{$productB->id}/attributes", [
                'attribute_id' => $attrA->id,
                'value' => 'Red'
            ]);

        $response->assertStatus(422);

        // User B attempts to access Org A's product
        $productA = $this->createOrgAProduct();
        $response = $this->actingAs($userB)
            ->deleteJson("/api/products/{$productA->id}/attributes/{$attrA->id}");

        $response->assertStatus(404);
    }

    private function createOrgAProduct(): Product
    {
        return Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Org A Tile',
            'sku' => 'ORGA-TILE-01',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->boxUnit->id,
            'sales_unit_id' => $this->boxUnit->id,
            'base_unit_id' => $this->boxUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'is_active' => true
        ]);
    }
}
