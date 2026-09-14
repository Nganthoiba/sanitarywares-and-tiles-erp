<?php

namespace Tests\Feature;

use App\Domains\Master\Models\Unit;
use App\Domains\Master\Services\UnitDimensionService;
use Tests\TestCase;

class UnitDimensionServiceTest extends TestCase
{
    public function test_dimension_category_classification()
    {
        $this->assertEquals('LENGTH', UnitDimensionService::getDimensionCategory('mm'));
        $this->assertEquals('LENGTH', UnitDimensionService::getDimensionCategory('cm'));
        $this->assertEquals('LENGTH', UnitDimensionService::getDimensionCategory('ft'));

        $this->assertEquals('AREA', UnitDimensionService::getDimensionCategory('sq.ft'));
        $this->assertEquals('AREA', UnitDimensionService::getDimensionCategory('sq.m'));

        $this->assertEquals('MASS', UnitDimensionService::getDimensionCategory('kg'));
        $this->assertEquals('MASS', UnitDimensionService::getDimensionCategory('g'));

        $this->assertEquals('COUNT', UnitDimensionService::getDimensionCategory('pcs'));
        $this->assertEquals('COUNT', UnitDimensionService::getDimensionCategory('slab'));

        $this->assertEquals('PACKAGING_COUNT', UnitDimensionService::getDimensionCategory('box'));
        $this->assertEquals('PACKAGING_COUNT', UnitDimensionService::getDimensionCategory('bag'));
    }

    public function test_universal_physical_conversion_multipliers()
    {
        // 1 cm = 10 mm
        $cmToMm = UnitDimensionService::getUniversalMultiplier('cm', 'mm');
        $this->assertEquals(10.0, $cmToMm);

        // 1 m = 100 cm = 1000 mm
        $mToMm = UnitDimensionService::getUniversalMultiplier('m', 'mm');
        $this->assertEquals(1000.0, $mToMm);

        // 1 kg = 1000 g
        $kgToG = UnitDimensionService::getUniversalMultiplier('kg', 'g');
        $this->assertEquals(1000.0, $kgToG);

        // Cross-dimension (e.g. cm -> sq.ft) should return null (product-dependent)
        $crossDim = UnitDimensionService::getUniversalMultiplier('cm', 'sq.ft');
        $this->assertNull($crossDim);

        // Packaging conversion (e.g. box -> pcs) should return null (product-dependent)
        $pkgConv = UnitDimensionService::getUniversalMultiplier('box', 'pcs');
        $this->assertNull($pkgConv);
    }
}
