<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Unit;
use App\Library\Database\AutoIncrement;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            // Measurement Units (Physical Specifications)
            ['id' => 1, 'name' => 'milimeter', 'symbol' => 'mm', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 2, 'name' => 'centimeter', 'symbol' => 'cm', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 3, 'name' => 'meter', 'symbol' => 'm', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 4, 'name' => 'feet', 'symbol' => 'ft', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 5, 'name' => 'inch', 'symbol' => 'in', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 6, 'name' => 'square feet', 'symbol' => 'sq.ft.', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 7, 'name' => 'square meter', 'symbol' => 'sq.m', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 8, 'name' => 'liter', 'symbol' => 'l', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 9, 'name' => 'cubic meter', 'symbol' => 'cu.m', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 10, 'name' => 'cubic feet', 'symbol' => 'cu.ft', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 11, 'name' => 'kilogram', 'symbol' => 'kg', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],
            ['id' => 12, 'name' => 'gram', 'symbol' => 'g', 'type' => 'MEASUREMENT', 'decimal_places' => 3, 'is_active' => true],

            // Transaction Quantity / Packaging Units
            ['id' => 13, 'name' => 'box', 'symbol' => 'box', 'type' => 'QUANTITY', 'decimal_places' => 0, 'is_active' => true],
            ['id' => 14, 'name' => 'piece', 'symbol' => 'pcs', 'type' => 'QUANTITY', 'decimal_places' => 0, 'is_active' => true],
            ['id' => 15, 'name' => 'slab', 'symbol' => 'slab', 'type' => 'QUANTITY', 'decimal_places' => 0, 'is_active' => true],
            ['id' => 16, 'name' => 'bag', 'symbol' => 'bag', 'type' => 'QUANTITY', 'decimal_places' => 0, 'is_active' => true],
            ['id' => 17, 'name' => 'roll', 'symbol' => 'roll', 'type' => 'QUANTITY', 'decimal_places' => 0, 'is_active' => true],
            ['id' => 18, 'name' => 'set', 'symbol' => 'set', 'type' => 'QUANTITY', 'decimal_places' => 0, 'is_active' => true],
        ];
        /*
        foreach ($units as $u) {
            Unit::updateOrCreate(
                ['symbol' => $u['symbol']],
                $u
            );
        }
        */
        Unit::upsert($units, ['id'], ['name', 'symbol', 'type', 'decimal_places', 'is_active']);

        AutoIncrement::resetIndex('units', 'id');
    }
}
