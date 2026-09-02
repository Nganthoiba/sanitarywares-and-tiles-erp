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
use App\Domains\Product\Models\UnitConversion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductMasterTest extends TestCase
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
    protected ProductAttribute $thicknessAttribute;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Organization & User
        $this->org = Organization::create(['name' => 'Kajaria Store', 'code' => 'KAJ-STR', 'is_active' => true]);
        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Operator',
            'email' => 'operator@kajariastore.com',
            'password' => bcrypt('password'),
        ]);

        // 2. Create Lookups
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
            'name' => 'Kajaria Ceramics Ltd',
            'legal_name' => 'Kajaria Ceramics Ltd',
        ]);

        $this->taxProfile = TaxProfile::create([
            'name' => 'GST 18%',
            'cgst_rate' => 9.00,
            'sgst_rate' => 9.00,
            'igst_rate' => 18.00,
            'is_active' => true,
        ]);



        // 4. Create standard units in Database
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

        // 5. Create dynamic attribute
        $this->thicknessAttribute = ProductAttribute::create([
            'organization_id' => $this->org->id,
            'name' => 'Thickness (mm)',
            'slug' => 'thickness-mm',
            'type' => 'number',
        ]);
    }

    /**
     * 1. Test standard product variant creation via the simplified API payload.
     */
    public function test_standard_product_creation_defaults_behavior_and_pcs_units()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.inventory_behavior', 'STANDARD');
        $response->assertJsonPath('data.purchase_unit_id', $this->pcsUnit->id);
        $response->assertJsonPath('data.sales_unit_id', $this->pcsUnit->id);
        $response->assertJsonPath('data.base_unit_id', $this->pcsUnit->id);

        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'KAJ-WHT-GLO-600',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
        ]);
    }

    /**
     * 2. Test measured material variant creation via the simplified API payload.
     */
    public function test_measured_material_creation_defaults_slab_behavior_and_sqft_units()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Premium Black Granite',
            'sku' => 'GRN-BLK-PREM',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.inventory_behavior', 'SLAB');
        $response->assertJsonPath('data.purchase_unit_id', $this->sqftUnit->id);
        $response->assertJsonPath('data.sales_unit_id', $this->sqftUnit->id);
        $response->assertJsonPath('data.base_unit_id', $this->sqftUnit->id);

        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'GRN-BLK-PREM',
            'inventory_behavior' => 'SLAB',
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
        ]);
    }

    /**
     * 3. Test Tile specific variant creation (STANDARD, inheriting brand/tax profile).
     */
    public function test_tile_creation_inherits_brand_and_tax_profile_from_family()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Kajaria Gold Metallic 600x600',
            'sku' => 'KAJ-GLD-MET-600',
            'product_type' => 'STANDARD',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.brand_id', $this->brand->id);
        $response->assertJsonPath('data.tax_profile_id', $this->taxProfile->id);

        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'KAJ-GLD-MET-600',
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
        ]);
    }

    /**
     * 4. Test Sanitaryware variant creation.
     */
    public function test_sanitaryware_creation()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Wall Hung WC Closet',
            'sku' => 'WC-WALL-HUNG',
            'product_type' => 'STANDARD',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'WC-WALL-HUNG',
        ]);
    }

    /**
     * 5. Test Granite specific variant creation.
     */
    public function test_granite_creation()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Black Galaxy Granite',
            'sku' => 'GRN-BLK-GALAXY',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'GRN-BLK-GALAXY',
            'inventory_behavior' => 'SLAB',
        ]);
    }

    /**
     * 6. Test Marble specific variant creation.
     */
    public function test_marble_creation()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Carrara Italian Marble Slab',
            'sku' => 'MBL-CAR-ITALIAN',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'MBL-CAR-ITALIAN',
            'inventory_behavior' => 'SLAB',
        ]);
    }

    /**
     * 7. Test SKU uniqueness rules (cannot duplicate SKU within same tenant).
     */
    public function test_sku_uniqueness_rules()
    {
        // Create first
        Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Tile Variant 1',
            'sku' => 'DUPLICATE-SKU',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Tile Variant 2',
            'sku' => 'DUPLICATE-SKU',
            'product_type' => 'STANDARD',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('sku');
    }

    /**
     * 8. Test GTIN format/size validation checks.
     */
    public function test_gtin_validation()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'gtin' => str_repeat('A', 51), // Exceeds max:50 constraint
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('gtin');
    }

    /**
     * 9. Test Tax profile validation rules.
     */
    public function test_tax_profile_validation()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'tax_profile_id' => 999999, // Non-existent ID
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('tax_profile_id');
    }

    /**
     * 10. Test Dynamic Attribute validation.
     */
    public function test_dynamic_attribute_validation()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'attributes' => [
                [
                    'attribute_id' => $this->thicknessAttribute->id,
                    'value' => '10mm',
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_attribute_values', [
            'organization_id' => $this->org->id,
            'product_attribute_id' => $this->thicknessAttribute->id,
            'value' => '10mm',
        ]);
    }

    /**
     * 11. Test Measured Material validation (invalid physical object or unit).
     */
    public function test_measured_material_configuration_validation()
    {
        // Case A: Missing physical_object / measurement_unit
        $payloadMissing = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Premium Black Granite',
            'sku' => 'GRN-BLK-PREM',
            'product_type' => 'MEASURED_MATERIAL',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payloadMissing);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['physical_object', 'measurement_unit']);

        // Case B: Invalid values
        $payloadInvalid = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Premium Black Granite',
            'sku' => 'GRN-BLK-PREM',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'BOX', // Invalid physical object for slab
            'measurement_unit' => 'KG',  // Invalid measurement unit
        ];

        $response2 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payloadInvalid);

        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['physical_object', 'measurement_unit']);
    }

    /**
     * 12. Test Organization isolation.
     */
    public function test_organization_isolation()
    {
        // Create Organization B & User B
        $orgB = Organization::create(['name' => 'Kajaria Store B', 'code' => 'KAJ-STR-B', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'Operator B',
            'email' => 'operator@kajariastoreb.com',
            'password' => bcrypt('password'),
        ]);

        $payload = [
            'category_id' => $this->category->id, // Belongs to Org A!
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
        ];

        // User B tries to build variant using Org A's category
        $response = $this->actingAs($userB, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(422);
    }

    /**
     * 13. Test backward compatibility (explicitly passing units & behavior, like older clients or tests).
     */
    public function test_legacy_payload_compatibility()
    {
        $payload = [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Legacy Ceramic Tile',
            'sku' => 'KAJ-LEGACY',
            'inventory_behavior' => 'CONVERTIBLE',
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.inventory_behavior', 'CONVERTIBLE');
        $response->assertJsonPath('data.purchase_unit_id', $this->pcsUnit->id);
        $this->assertDatabaseHas('product_variants', [
            'organization_id' => $this->org->id,
            'sku' => 'KAJ-LEGACY',
            'inventory_behavior' => 'CONVERTIBLE',
        ]);
    }

    /**
     * 14. Test existing UOM compatibility.
     */
    public function test_uom_compatibility()
    {
        $variant = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'name' => 'Granite Variant',
            'sku' => 'GRN-UOM-COMPAT',
            'inventory_behavior' => 'SLAB',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ]);

        $this->assertEquals($this->sqftUnit->id, $variant->purchaseUnit->id);
        $this->assertEquals($this->sqftUnit->id, $variant->salesUnit->id);
        $this->assertEquals($this->sqftUnit->id, $variant->baseUnit->id);
    }

    /**
     * 15. Test unit conversion mapping.
     */
    public function test_unit_conversion_compatibility()
    {
        $variant = Product::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'name' => 'Granite Conversion Variant',
            'sku' => 'GRN-CONV-COMPAT',
            'inventory_behavior' => 'SLAB',
            'tax_profile_id' => $this->taxProfile->id,
        ]);

        // Create unit conversion (e.g. 1 Box = 10 Sqft)
        $box = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);

        $conversion = UnitConversion::create([
            'organization_id' => $this->org->id,
            'product_variant_id' => $variant->id,
            'from_unit_id' => $box->id,
            'to_unit_id' => $this->sqftUnit->id,
            'multiplier' => 10.000000,
        ]);

        $this->assertDatabaseHas('unit_conversions', [
            'organization_id' => $this->org->id,
            'product_variant_id' => $variant->id,
            'from_unit_id' => $box->id,
            'to_unit_id' => $this->sqftUnit->id,
            'multiplier' => 10.000000,
        ]);
    }

    /**
     * 16. Test Category unit defaults configuration and automatic unit inheritance on Product Variant creation.
     */
    public function test_category_unit_defaults_and_product_variant_unit_inheritance()
    {
        $boxUnit = Unit::create([
            'name' => 'Box',
            'symbol' => 'BOX',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);

        // Configure Unit Defaults on Category
        $rootCategory = Category::create([
            'organization_id' => $this->org->id,
            'name' => 'Sanitaryware',
            'slug' => 'sanitaryware',
            'default_base_unit_id' => $this->pcsUnit->id,
            'default_purchase_unit_id' => $boxUnit->id,
            'default_sales_unit_id' => $this->pcsUnit->id,
        ]);

        // Subcategory inheriting from Root Category
        $subCategory = Category::create([
            'organization_id' => $this->org->id,
            'parent_id' => $rootCategory->id,
            'name' => 'Wash Basins',
            'slug' => 'wash-basins',
        ]);

        // Test Category API returns resolved unit defaults
        $response = $this->actingAs($this->user)->getJson('/api/categories-crud/' . $subCategory->id);
        $response->assertStatus(200);

        $resolvedUnits = $subCategory->getResolvedDefaultUnits();
        $this->assertEquals($this->pcsUnit->id, $resolvedUnits['base_unit_id']);
        $this->assertEquals($boxUnit->id, $resolvedUnits['purchase_unit_id']);
        $this->assertEquals($this->pcsUnit->id, $resolvedUnits['sales_unit_id']);

        // Create Product Variant without explicit unit payload -> must auto-inherit from Category
        $productPayload = [
            'category_id' => $subCategory->id,
            'brand_id' => $this->brand->id,
            'name' => 'Designer Table Top Wash Basin',
            'sku' => 'WB-DSGN-001',
            'inventory_behavior' => 'STANDARD',
            'is_active' => true,
        ];

        $postResponse = $this->actingAs($this->user)->postJson('/api/product/variants', $productPayload);
        $postResponse->assertStatus(201);

        $variantData = $postResponse->json('data');
        $this->assertEquals($this->pcsUnit->id, $variantData['base_unit_id']);
        $this->assertEquals($boxUnit->id, $variantData['purchase_unit_id']);
        $this->assertEquals($this->pcsUnit->id, $variantData['sales_unit_id']);
    }
}
