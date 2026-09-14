<?php

namespace App\Domains\Master\Services;

use App\Domains\Master\Models\Unit;

class UnitDimensionService
{
    // Dimension Categories
    public const DIMENSION_LENGTH = 'LENGTH';
    public const DIMENSION_AREA = 'AREA';
    public const DIMENSION_MASS = 'MASS';
    public const DIMENSION_VOLUME = 'VOLUME';
    public const DIMENSION_COUNT = 'COUNT';
    public const DIMENSION_PACKAGING_COUNT = 'PACKAGING_COUNT';
    public const DIMENSION_NONE = 'NONE';

    /**
     * Map unit symbol to standard dimension category.
     */
    public static function getDimensionCategory(?string $symbol, ?string $legacyType = null): string
    {
        $sym = strtolower(trim($symbol ?? ''));

        if (in_array($sym, ['mm', 'cm', 'm', 'in', 'ft', 'feet', 'inch', 'inches', 'milimeter', 'meter'])) {
            return self::DIMENSION_LENGTH;
        }
        if (in_array($sym, ['sq.mm', 'sq.cm', 'sq.m', 'sq.in', 'sq.ft.', 'sqft', 'sq.ft', 'sqm'])) {
            return self::DIMENSION_AREA;
        }
        if (in_array($sym, ['l', 'ltr', 'litre', 'liter', 'ml', 'cu.mm', 'cu.cm', 'cu.m', 'cu.ft'])) {
            return self::DIMENSION_VOLUME;
        }
        if (in_array($sym, ['g', 'gm', 'gram', 'kg', 'ton', 'mt'])) {
            return self::DIMENSION_MASS;
        }
        if (in_array($sym, ['pcs', 'pc', 'piece', 'pieces', 'slab', 'slabs', 'set', 'pair'])) {
            return self::DIMENSION_COUNT;
        }
        if (in_array($sym, ['box', 'boxes', 'bag', 'bags', 'carton', 'bundle', 'crate', 'pallet'])) {
            return self::DIMENSION_PACKAGING_COUNT;
        }

        $type = strtoupper(trim($legacyType ?? ''));
        if (in_array($type, [self::DIMENSION_LENGTH, self::DIMENSION_AREA, self::DIMENSION_VOLUME, self::DIMENSION_MASS, self::DIMENSION_COUNT, self::DIMENSION_PACKAGING_COUNT])) {
            return $type;
        }

        return self::DIMENSION_NONE;
    }

    /**
     * Resolve universal physical conversion multiplier between two units in the same dimension.
     * Returns multiplier where targetQuantity = sourceQuantity * multiplier, or null if not universally convertible.
     */
    public static function getUniversalMultiplier(Unit|string $fromUnit, Unit|string $toUnit): ?float
    {
        $fromSym = strtolower(trim($fromUnit instanceof Unit ? $fromUnit->symbol : $fromUnit));
        $toSym = strtolower(trim($toUnit instanceof Unit ? $toUnit->symbol : $toUnit));

        if ($fromSym === $toSym) {
            return 1.0;
        }

        $fromCategory = self::getDimensionCategory($fromSym);
        $toCategory = self::getDimensionCategory($toSym);

        // Universal conversions only apply within the same physical dimension
        if ($fromCategory === self::DIMENSION_NONE || $fromCategory !== $toCategory) {
            return null;
        }

        // Standardize symbols
        $fromNorm = self::normalizeSymbol($fromSym);
        $toNorm = self::normalizeSymbol($toSym);

        if ($fromNorm === $toNorm) {
            return 1.0;
        }

        // Universal Length Factors (to mm)
        $lengthToMm = [
            'mm' => 1.0,
            'cm' => 10.0,
            'm' => 1000.0,
            'in' => 25.4,
            'ft' => 304.8,
        ];

        if ($fromCategory === self::DIMENSION_LENGTH && isset($lengthToMm[$fromNorm], $lengthToMm[$toNorm])) {
            return $lengthToMm[$fromNorm] / $lengthToMm[$toNorm];
        }

        // Universal Area Factors (to sq.ft)
        $areaToSqFt = [
            'sq.ft' => 1.0,
            'sq.m' => 10.7639104,
            'sq.in' => 1 / 144,
            'sq.cm' => 1 / 929.0304,
            'sq.mm' => 1 / 92903.04,
        ];

        if ($fromCategory === self::DIMENSION_AREA && isset($areaToSqFt[$fromNorm], $areaToSqFt[$toNorm])) {
            return $areaToSqFt[$fromNorm] / $areaToSqFt[$toNorm];
        }

        // Universal Mass Factors (to kg)
        $massToKg = [
            'g' => 0.001,
            'kg' => 1.0,
            'ton' => 1000.0,
            'mt' => 1000.0,
        ];

        if ($fromCategory === self::DIMENSION_MASS && isset($massToKg[$fromNorm], $massToKg[$toNorm])) {
            return $massToKg[$fromNorm] / $massToKg[$toNorm];
        }

        // Universal Volume Factors (to l)
        $volumeToL = [
            'ml' => 0.001,
            'l' => 1.0,
        ];

        if ($fromCategory === self::DIMENSION_VOLUME && isset($volumeToL[$fromNorm], $volumeToL[$toNorm])) {
            return $volumeToL[$fromNorm] / $volumeToL[$toNorm];
        }

        return null;
    }

    protected static function normalizeSymbol(string $sym): string
    {
        return match ($sym) {
            'millimeter', 'milimeter', 'mm' => 'mm',
            'centimeter', 'cm' => 'cm',
            'meter', 'm' => 'm',
            'inch', 'inches', 'in' => 'in',
            'feet', 'foot', 'ft' => 'ft',
            'sqft', 'sq.ft.', 'sq.ft' => 'sq.ft',
            'sqm', 'sq.m' => 'sq.m',
            'sq.in', 'sqin' => 'sq.in',
            'sq.cm', 'sqcm' => 'sq.cm',
            'sq.mm', 'sqmm' => 'sq.mm',
            'g', 'gm', 'gram' => 'g',
            'kg', 'kilogram' => 'kg',
            'ton', 'mt' => 'ton',
            'ml', 'milliliter' => 'ml',
            'l', 'ltr', 'liter', 'litre' => 'l',
            'pcs', 'pc', 'piece', 'pieces' => 'pcs',
            'box', 'boxes' => 'box',
            'bag', 'bags' => 'bag',
            'slab', 'slabs' => 'slab',
            default => $sym,
        };
    }
}
