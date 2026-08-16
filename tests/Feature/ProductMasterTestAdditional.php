<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
use App\Domains\Product\Models\UnitConversion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductMasterTestAdditional extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Category $category;
    protected Brand $brand;
    protected Manufacturer $manufacturer;
    protected TaxProfile $taxProfile;

    protected Unit $pcsUnit;
    protected Unit $sqftUnit;
    protected Unit $boxUnit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create(['name' => 'Kajaria Store', 'code' => 'KAJ-STR', 'is_active' => true]);
        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Operator',
            'email' => 'operator@kajariastore.com',
            'password' => bcrypt('password'),
        ]);

        $this->category = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Tiles',
            'slug' => 'tiles',
        ]);

        $this->brand = Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Kajaria',
            'slug' => 'kajaria',
        ]);

        $this->manufacturer = Manufacturer::create([
            'organization_id' => $this->org->id,
            'name' => 'Kajaria Ceramics Ltd',
            'slug' => 'kajaria-ceramics-ltd',
        ]);

        $this->taxProfile = TaxProfile::create([
            'organization_id' => $this->org->id,
            'name' => 'GST 18%',
            'cgst_rate' => 9.00,
            'sgst_rate' => 9.00,
            'igst_rate' => 18.00,
            'is_active' => true,
        ]);



        $this->pcsUnit = Unit::create([
            'name' => 'Piece',
            'symbol' => 'PCS',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);

        $this->sqftUnit = Unit::create([
            'name' => 'Square Feet',
            'symbol' => 'SQFT',
            'type' => 'MEASUREMENT',
            'decimal_places' => 3,
        ]);

        $this->boxUnit = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);
    }

    /**
     * Test retrieving product variant details.
     */
    public function test_can_retrieve_product_details()
    {
        $variant = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/product/variants/{$variant->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('name', 'Kajaria White Glossy 600x600');
        $response->assertJsonPath('sku', 'KAJ-WHT-GLO-600');
    }

    /**
     * Test product variant creation with family optionality (fallback default family resolution).
     */
    public function test_product_creation_resolves_default_family_when_family_id_omitted()
    {
        $newCategory = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Sanitaryware',
            'slug' => 'sanitaryware',
        ]);

        $newBrand = Brand::create([
            'organization_id' => $this->org->id,
            'name' => 'Hindware',
            'slug' => 'hindware',
        ]);

        $payload = [
            'name' => 'Uncategorized Tile Variant',
            'sku' => 'UNCAT-TILE-001',
            'category_id' => $newCategory->id,
            'brand_id' => $newBrand->id,
            'product_type' => 'STANDARD',
            'cost_price' => 500.00,
            'sale_price' => 700.00,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'UNCAT-TILE-001',
            'category_id' => $newCategory->id,
            'brand_id' => $newBrand->id,
        ]);
    }

    /**
     * Test updating product variant details.
     */
    public function test_can_update_product_details()
    {
        $variant = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
        ]);

        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria White Glossy 600x600 Updated',
            'sku' => 'KAJ-WHT-GLO-600-UPD',
            'cost_price' => 850.00,
            'sale_price' => 1050.00,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/product/variants/{$variant->id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('product_variants', [
            'id' => $variant->id,
            'name' => 'Kajaria White Glossy 600x600 Updated',
            'sku' => 'KAJ-WHT-GLO-600-UPD',
            'cost_price' => 850.00,
            'sale_price' => 1050.00,
        ]);
    }

    /**
     * Test SKU uniqueness during update.
     */
    public function test_cannot_update_sku_to_taken_sku()
    {
        $variant1 = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Product 1',
            'sku' => 'SKU-ONE',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ]);

        $variant2 = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Product 2',
            'sku' => 'SKU-TWO',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ]);

        // Try updating Product 2 to use Product 1's SKU
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Product 2 Updated',
            'sku' => 'SKU-ONE',
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/product/variants/{$variant2->id}", $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('sku');
    }

    /**
     * Test unit conversions APIs.
     */
    public function test_can_manage_unit_conversions()
    {
        $variant = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Tile Variant',
            'sku' => 'TILE-CONV',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ]);

        // 1. Create a unit conversion (1 BOX = 4 PCS)
        $payload = [
            'from_unit_id' => $this->boxUnit->id,
            'to_unit_id' => $this->pcsUnit->id,
            'multiplier' => 4.00,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/product/variants/{$variant->id}/conversions", $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('unit_conversions', [
            'organization_id' => $this->org->id,
            'product_variant_id' => $variant->id,
            'from_unit_id' => $this->boxUnit->id,
            'to_unit_id' => $this->pcsUnit->id,
            'multiplier' => 4.00,
        ]);

        $conversionId = $response->json('data.id');

        // 2. List unit conversions
        $listResponse = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/product/variants/{$variant->id}/conversions");

        $listResponse->assertStatus(200);
        $listResponse->assertJsonCount(1);
        $listResponse->assertJsonPath('0.id', $conversionId);

        // 3. Delete unit conversion
        $deleteResponse = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/product/conversions/{$conversionId}");

        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('unit_conversions', [
            'id' => $conversionId,
        ]);
    }

    /**
     * Test retrieving calculated inventory summary.
     */
    public function test_can_retrieve_calculated_inventory_summary()
    {
        $variant = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'name' => 'Tile Variant',
            'sku' => 'TILE-INV',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/product/variants/{$variant->id}/inventory-summary");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'is_measured',
            'standard' => [
                'current_stock',
                'reserved_stock',
                'available_stock',
            ],
            'measured' => [
                'current_slabs',
                'total_area',
                'reserved_area',
                'available_area',
            ],
        ]);
    }
}
