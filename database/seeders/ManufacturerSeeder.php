<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Manufacturer;
use Illuminate\Database\Seeder;

class ManufacturerSeeder extends Seeder
{
    public function run(): void
    {
        $manufacturers = [
            [
                'name' => 'Kajaria Ceramics Limited',
                'legal_name' => 'Kajaria Ceramics Limited',
                'trade_name' => 'Kajaria',
                'cin' => 'L26914UP1985PLC007321',
                'registration_no' => 'L26914UP1985PLC007321',
                'registration_number' => 'L26914UP1985PLC007321',
                'business_constitution' => 'PUBLIC_LIMITED',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
            [
                'name' => 'Somany Ceramics Limited',
                'legal_name' => 'Somany Ceramics Limited',
                'trade_name' => 'Somany',
                'cin' => 'L40200WB1968PLC027339',
                'registration_no' => 'L40200WB1968PLC027339',
                'registration_number' => 'L40200WB1968PLC027339',
                'business_constitution' => 'PUBLIC_LIMITED',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
            [
                'name' => 'Jaquar & Company Private Limited',
                'legal_name' => 'Jaquar & Company Private Limited',
                'trade_name' => 'Jaquar',
                'cin' => 'U74899HR1986PTC049876',
                'registration_no' => 'U74899HR1986PTC049876',
                'registration_number' => 'U74899HR1986PTC049876',
                'business_constitution' => 'PRIVATE_LIMITED',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
        ];

        foreach ($manufacturers as $m) {
            Manufacturer::updateOrCreate(
                ['legal_name' => $m['legal_name']],
                $m
            );
        }
    }
}
