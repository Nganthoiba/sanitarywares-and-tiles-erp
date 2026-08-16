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
                'legal_name' => 'Kajaria Ceramics Limited',
                'trade_name' => 'Kajaria',
                'gstin' => '27AAACK1234F1Z5',
                'registration_number' => 'L26914UP1985PLC007321',
                'business_constitution' => 'PUBLIC_LIMITED',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
            [
                'legal_name' => 'Somany Ceramics Limited',
                'trade_name' => 'Somany',
                'gstin' => '19AAACS5678G1Z2',
                'registration_number' => 'L40200WB1968PLC027339',
                'business_constitution' => 'PUBLIC_LIMITED',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
            [
                'legal_name' => 'Jaquar & Company Private Limited',
                'trade_name' => 'Jaquar',
                'gstin' => '06AAACJ9012H1Z9',
                'registration_number' => 'U74899HR1986PTC049876',
                'business_constitution' => 'PRIVATE_LIMITED',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
        ];

        foreach ($manufacturers as $m) {
            Manufacturer::updateOrCreate(
                ['gstin' => $m['gstin']],
                $m
            );
        }
    }
}
