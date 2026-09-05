<?php

namespace App\Domains\Product\Services;

class TileDimensionService
{
    /**
     * Conversion multipliers to convert 1 unit of length into millimetres (mm).
     */
    protected static array $toMmMultipliers = [
        'mm' => 1.0,
        'milimeter' => 1.0,
        'millimeter' => 1.0,
        'cm' => 10.0,
        'centimeter' => 10.0,
        'm' => 1000.0,
        'meter' => 1000.0,
        'in' => 25.4,
        'inch' => 25.4,
        'ft' => 304.8,
        'feet' => 304.8,
    ];

    /**
     * Normalize a single length value to millimetres (mm).
     */
    public static function normalizeToMm(float|int $val, string $unitSymbol): float
    {
        $symbol = strtolower(trim($unitSymbol));
        $multiplier = static::$toMmMultipliers[$symbol] ?? 304.8; // Default legacy fallback: ft (304.8 mm)
        return (float) ($val * $multiplier);
    }

    /**
     * Convert value from millimetres (mm) to a target unit.
     */
    public static function convertFromMm(float|int $mmValue, string $targetUnitSymbol): float
    {
        $symbol = strtolower(trim($targetUnitSymbol));
        $multiplier = static::$toMmMultipliers[$symbol] ?? 304.8;
        return (float) ($mmValue / $multiplier);
    }

    /**
     * Calculate coverage area in Square Metres (m²) from millimetre dimensions.
     */
    public static function calculateAreaSqM(float|int $lengthMm, float|int $widthMm): float
    {
        if ($lengthMm <= 0 || $widthMm <= 0) {
            return 0.0;
        }
        return (float) (($lengthMm * $widthMm) / 1000000.0);
    }

    /**
     * Calculate coverage area in Square Feet (sq.ft.) from millimetre dimensions.
     */
    public static function calculateAreaSqFt(float|int $lengthMm, float|int $widthMm): float
    {
        if ($lengthMm <= 0 || $widthMm <= 0) {
            return 0.0;
        }
        // 1 sq metre = 10.763910416710989 sq feet (or 1 sq ft = 92903.04 sq mm)
        return (float) (($lengthMm * $widthMm) / 92903.04);
    }

    /**
     * Normalize dimensions (length, width, unit) into canonical mm and calculated coverage areas.
     */
    public static function normalizeDimensions(float|int $length, float|int $width, string $unitSymbol = 'ft'): array
    {
        $lengthMm = static::normalizeToMm($length, $unitSymbol);
        $widthMm = static::normalizeToMm($width, $unitSymbol);

        $areaSqm = static::calculateAreaSqM($lengthMm, $widthMm);
        $areaSqft = static::calculateAreaSqFt($lengthMm, $widthMm);

        return [
            'raw_length' => (float) $length,
            'raw_width' => (float) $width,
            'unit_symbol' => strtolower(trim($unitSymbol)),
            'length_mm' => round($lengthMm, 4),
            'width_mm' => round($widthMm, 4),
            'coverage_area_sqm' => round($areaSqm, 4),
            'coverage_area_sqft' => round($areaSqft, 4),
        ];
    }

    /**
     * Parse a size preset string such as "60 × 60 cm", "600 × 1200 mm", "2 × 2 ft", "12 × 24 in".
     */
    public static function parsePresetSize(string $sizeString): ?array
    {
        $str = trim($sizeString);
        if ($str === '' || $str === 'Custom Size') {
            return null;
        }

        // Match patterns like "60 × 60 cm", "600 x 1200 mm", "2 .5 X 4 ft", "12x24 inch"
        if (preg_match('/^(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z\.\s]+)?$/u', $str, $matches)) {
            $length = (float) $matches[1];
            $width = (float) $matches[2];
            $unitSymbol = isset($matches[3]) ? trim($matches[3]) : 'ft';

            if ($unitSymbol === '') {
                $unitSymbol = 'ft';
            }

            return static::normalizeDimensions($length, $width, $unitSymbol);
        }

        return null;
    }

    /**
     * Format a display dimension string (e.g. "60 × 60 cm", "600 × 1200 mm", "2 × 4 ft").
     */
    public static function formatDisplaySize(float|int $length, float|int $width, string $unitSymbol): string
    {
        $lStr = (float) $length == (int) $length ? (string) (int) $length : (string) round($length, 2);
        $wStr = (float) $width == (int) $width ? (string) (int) $width : (string) round($width, 2);
        $uStr = strtolower(trim($unitSymbol));
        return "{$lStr} × {$wStr} {$uStr}";
    }

    /**
     * Check if a unit symbol is a supported length unit.
     */
    public static function isValidLengthUnit(string $unitSymbol): bool
    {
        $symbol = strtolower(trim($unitSymbol));
        return array_key_exists($symbol, static::$toMmMultipliers);
    }
}
