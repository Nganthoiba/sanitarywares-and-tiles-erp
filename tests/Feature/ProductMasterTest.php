<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\ProductFamily;
use App\Domains\Product\Models\ProductVariant;
use App\Domains\Product\Models\ProductAttribute;
use App\Domains\Product\Models\ProductAttributeValue;
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
    protected ProductFamily $family;
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

        // 3. Create Product Family
        $this->family = ProductFamily::create([
            'organization_id' => $this->org->id,
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $this->taxProfile->id,
            'name' => 'Kajaria Polished Vitrified',
            'code' => 'KAJ-PV',
        ]);

        // 4. Create standard units in Database
        $this->pcsUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Piece',
            'symbol' => 'PCS',
            'type' => 'QUANTITY',
            'decimal_places' => 0,
        ]);

        $this->sqftUnit = Unit::create([
            'organization_id' => $this->org->id,
            'name' => 'Square Feet',
            'symbol' => 'SQFT',
            'type' => 'AREA',
            'decimal_places' => 2,
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
            'product_family_id' => $this->family->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Premium Black Granite',
            'sku' => 'GRN-BLK-PREM',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
            'cost_price' => 200.00,
            'sale_price' => 350.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Kajaria Gold Metallic 600x600',
            'sku' => 'KAJ-GLD-MET-600',
            'product_type' => 'STANDARD',
            'cost_price' => 900.00,
            'sale_price' => 1200.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Wall Hung WC Closet',
            'sku' => 'WC-WALL-HUNG',
            'product_type' => 'STANDARD',
            'cost_price' => 5000.00,
            'sale_price' => 7500.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Black Galaxy Granite',
            'sku' => 'GRN-BLK-GALAXY',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
            'cost_price' => 250.00,
            'sale_price' => 400.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Carrara Italian Marble Slab',
            'sku' => 'MBL-CAR-ITALIAN',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'SLAB',
            'measurement_unit' => 'SQFT',
            'cost_price' => 300.00,
            'sale_price' => 600.00,
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
        ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $this->family->id,
            'name' => 'Tile Variant 1',
            'sku' => 'DUPLICATE-SKU',
            'inventory_behavior' => 'STANDARD',
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 10.00,
            'sale_price' => 15.00,
        ]);

        $payload = [
            'product_family_id' => $this->family->id,
            'name' => 'Tile Variant 2',
            'sku' => 'DUPLICATE-SKU',
            'product_type' => 'STANDARD',
            'cost_price' => 20.00,
            'sale_price' => 30.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'gtin' => str_repeat('A', 51), // Exceeds max:50 constraint
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'tax_profile_id' => 999999, // Non-existent ID
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
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
            'product_family_id' => $this->family->id,
            'name' => 'Premium Black Granite',
            'sku' => 'GRN-BLK-PREM',
            'product_type' => 'MEASURED_MATERIAL',
            'cost_price' => 200.00,
            'sale_price' => 350.00,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/product/variants', $payloadMissing);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['physical_object', 'measurement_unit']);

        // Case B: Invalid values
        $payloadInvalid = [
            'product_family_id' => $this->family->id,
            'name' => 'Premium Black Granite',
            'sku' => 'GRN-BLK-PREM',
            'product_type' => 'MEASURED_MATERIAL',
            'physical_object' => 'BOX', // Invalid physical object for slab
            'measurement_unit' => 'KG',  // Invalid measurement unit
            'cost_price' => 200.00,
            'sale_price' => 350.00,
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
            'product_family_id' => $this->family->id, // Belongs to Org A!
            'name' => 'Kajaria White Glossy 600x600',
            'sku' => 'KAJ-WHT-GLO-600',
            'product_type' => 'STANDARD',
            'cost_price' => 800.00,
            'sale_price' => 1000.00,
        ];

        // User B tries to build variant using Org A's family
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
            'product_family_id' => $this->family->id,
            'name' => 'Legacy Ceramic Tile',
            'sku' => 'KAJ-LEGACY',
            'inventory_behavior' => 'CONVERTIBLE',
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
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
        $variant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $this->family->id,
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
        $variant = ProductVariant::create([
            'organization_id' => $this->org->id,
            'product_family_id' => $this->family->id,
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'name' => 'Granite Conversion Variant',
            'sku' => 'GRN-CONV-COMPAT',
            'inventory_behavior' => 'SLAB',
            'tax_profile_id' => $this->taxProfile->id,
            'cost_price' => 100.00,
            'sale_price' => 150.00,
        ]);

        // Create unit conversion (e.g. 1 Box = 10 Sqft)
        $box = Unit::create([
            'organization_id' => $this->org->id,
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
}
