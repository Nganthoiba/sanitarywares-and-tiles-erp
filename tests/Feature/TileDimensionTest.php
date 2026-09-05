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
use App\Domains\Product\Services\TileDimensionService;

class TileDimensionTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Organization $org;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::first() ?? Organization::create([
            'name' => 'Test Org',
            'code' => 'ORG1',
            'email' => 'org@test.com',
            'status' => 'ACTIVE',
        ]);

        $this->user = User::where('organization_id', $this->org->id)->first()
            ?? User::factory()->create(['organization_id' => $this->org->id]);

        $this->seed(\Database\Seeders\UnitSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);
        $this->seed(\Database\Seeders\CategorySpecificationSeeder::class);
    }

    /** @test */
    public function it_normalizes_60x60_cm_correctly()
    {
        $result = TileDimensionService::normalizeDimensions(60, 60, 'cm');

        $this->assertEquals(60.0, $result['raw_length']);
        $this->assertEquals(60.0, $result['raw_width']);
        $this->assertEquals('cm', $result['unit_symbol']);
        $this->assertEquals(600.0, $result['length_mm']);
        $this->assertEquals(600.0, $result['width_mm']);
        $this->assertEquals(0.36, $result['coverage_area_sqm']);
        $this->assertEquals(3.875, $result['coverage_area_sqft']);
    }

    /** @test */
    public function it_normalizes_600x1200_mm_correctly()
    {
        $result = TileDimensionService::normalizeDimensions(600, 1200, 'mm');

        $this->assertEquals(600.0, $result['length_mm']);
        $this->assertEquals(1200.0, $result['width_mm']);
        $this->assertEquals(0.72, $result['coverage_area_sqm']);
        $this->assertEquals(7.75, $result['coverage_area_sqft']);
    }

    /** @test */
    public function it_normalizes_2x2_ft_correctly()
    {
        $result = TileDimensionService::normalizeDimensions(2, 2, 'ft');

        $this->assertEquals(609.6, $result['length_mm']);
        $this->assertEquals(609.6, $result['width_mm']);
        $this->assertEquals(0.3716, $result['coverage_area_sqm']);
        $this->assertEquals(4.0, $result['coverage_area_sqft']);
    }

    /** @test */
    public function it_normalizes_12x24_inch_correctly()
    {
        $result = TileDimensionService::normalizeDimensions(12, 24, 'in');

        $this->assertEquals(304.8, $result['length_mm']);
        $this->assertEquals(609.6, $result['width_mm']);
        $this->assertEquals(0.1858, $result['coverage_area_sqm']);
        $this->assertEquals(2.0, $result['coverage_area_sqft']);
    }

    /** @test */
    public function it_parses_preset_size_strings()
    {
        $parsedCm = TileDimensionService::parsePresetSize('60 × 60 cm');
        $this->assertNotNull($parsedCm);
        $this->assertEquals(600.0, $parsedCm['length_mm']);

        $parsedMm = TileDimensionService::parsePresetSize('600 x 1200 mm');
        $this->assertNotNull($parsedMm);
        $this->assertEquals(1200.0, $parsedMm['width_mm']);

        $parsedFt = TileDimensionService::parsePresetSize('2 × 2 ft');
        $this->assertNotNull($parsedFt);
        $this->assertEquals(4.0, $parsedFt['coverage_area_sqft']);

        $parsedIn = TileDimensionService::parsePresetSize('12 × 24 in');
        $this->assertNotNull($parsedIn);
        $this->assertEquals(2.0, $parsedIn['coverage_area_sqft']);

        $this->assertNull(TileDimensionService::parsePresetSize('Custom Size'));
        $this->assertNull(TileDimensionService::parsePresetSize(''));
    }

    /** @test */
    public function it_handles_zero_or_invalid_dimensions()
    {
        $result = TileDimensionService::normalizeDimensions(0, 600, 'mm');
        $this->assertEquals(0.0, $result['coverage_area_sqm']);
        $this->assertEquals(0.0, $result['coverage_area_sqft']);

        $this->assertFalse(TileDimensionService::isValidLengthUnit('invalid_unit'));
        $this->assertTrue(TileDimensionService::isValidLengthUnit('cm'));
        $this->assertTrue(TileDimensionService::isValidLengthUnit('mm'));
        $this->assertTrue(TileDimensionService::isValidLengthUnit('in'));
        $this->assertTrue(TileDimensionService::isValidLengthUnit('ft'));
    }

    /** @test */
    public function it_defaults_legacy_missing_unit_to_ft()
    {
        $result = TileDimensionService::normalizeDimensions(2, 2, 'invalid_symbol');
        $this->assertEquals(609.6, $result['length_mm']);
        $this->assertEquals(4.0, $result['coverage_area_sqft']);
    }

    /** @test */
    public function category_specifications_api_includes_length_units()
    {
        $tilesCategory = Category::where('slug', 'tiles')->first();
        $this->assertNotNull($tilesCategory);

        $response = $this->actingAs($this->user)->getJson("/api/categories/{$tilesCategory->id}/specifications");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'category_id',
            'category_name',
            'category_slug',
            'specifications',
            'length_units'
        ]);

        $units = $response->json('length_units');
        $unitSymbols = array_column($units, 'symbol');
        $this->assertContains('mm', $unitSymbols);
        $this->assertContains('cm', $unitSymbols);
        $this->assertContains('in', $unitSymbols);
        $this->assertContains('ft', $unitSymbols);
    }

    /** @test */
    public function it_formats_display_size_correctly()
    {
        $formatted = TileDimensionService::formatDisplaySize(60, 60, 'cm');
        $this->assertEquals('60 × 60 cm', $formatted);

        $formattedFt = TileDimensionService::formatDisplaySize(2, 4, 'ft');
        $this->assertEquals('2 × 4 ft', $formattedFt);
    }

    /** @test */
    public function it_allows_different_product_variants_to_have_different_dimension_units()
    {
        $variantACm = TileDimensionService::normalizeDimensions(60, 60, 'cm');
        $variantBFt = TileDimensionService::normalizeDimensions(2, 2, 'ft');
        $variantCMm = TileDimensionService::normalizeDimensions(600, 1200, 'mm');

        // Variant A (cm)
        $this->assertEquals('cm', $variantACm['unit_symbol']);
        $this->assertEquals(600.0, $variantACm['length_mm']);
        $this->assertEquals(600.0, $variantACm['width_mm']);

        // Variant B (ft)
        $this->assertEquals('ft', $variantBFt['unit_symbol']);
        $this->assertEquals(609.6, $variantBFt['length_mm']);
        $this->assertEquals(609.6, $variantBFt['width_mm']);

        // Variant C (mm)
        $this->assertEquals('mm', $variantCMm['unit_symbol']);
        $this->assertEquals(600.0, $variantCMm['length_mm']);
        $this->assertEquals(1200.0, $variantCMm['width_mm']);
    }
}
