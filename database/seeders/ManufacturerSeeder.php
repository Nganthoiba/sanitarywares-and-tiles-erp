<?php

namespace Database\Seeders;

use App\Domains\Master\Models\Manufacturer;
use Illuminate\Database\Seeder;

class ManufacturerSeeder extends Seeder
{
    /**
     * Seed global manufacturers.
     *
     * Manufacturers are global master data and therefore do not belong
     * to any particular organization.
     */
    public function run(): void
    {
        $manufacturers = [

            [
                'legal_name' => 'Kajaria Ceramics Limited',
                'trade_name' => 'Kajaria',
                'cin' => 'L26924HR1985PLC056150',
                'registration_number' => '056150',
                'business_constitution' => 'PUBLIC_LIMITED',
                'address' => 'SF-11, Second Floor, JMD Regent Plaza, Mehrauli Gurugram Road, Village Sikanderpur Ghosi, Gurugram, Haryana - 122001',
                'phone' => '+91-124-4081281',
                'email' => 'investors@kajariaceramics.com',
                'website' => 'https://www.kajariaceramics.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Somany Ceramics Limited',
                'trade_name' => 'Somany',
                'cin' => 'L40200DL1968PLC005169',
                'registration_number' => '005169',
                'business_constitution' => 'PUBLIC_LIMITED',
                'address' => '2, Red Cross Place, Kolkata - 700001, West Bengal, India',
                'phone' => '0120-4627900',
                'email' => 'corporateaffairs@somanyceramics.com',
                'website' => 'https://www.somanyceramics.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Cera Sanitaryware Limited',
                'trade_name' => 'CERA',
                'cin' => 'L26910GJ1998PLC034400',
                'registration_number' => '034400',
                'business_constitution' => 'PUBLIC_LIMITED',
                'address' => '9, GIDC Industrial Estate, Kadi, District Mehsana, Gujarat - 382715',
                'phone' => '+91-2764-243000',
                'email' => 'kadi@cera-india.com',
                'website' => 'https://www.cera-india.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Orient Bell Limited',
                'trade_name' => 'Orientbell',
                'cin' => 'L14101UP1977PLC021546',
                'registration_number' => '021546',
                'business_constitution' => 'PUBLIC_LIMITED',
                'address' => '8, Industrial Area, Sikandrabad - 203205, District Bulandshahr, Uttar Pradesh, India',
                'phone' => '+91-11-47119100',
                'email' => 'customercare@orientbell.com',
                'website' => 'https://www.orientbell.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Asian Granito India Limited',
                'trade_name' => 'AGL',
                'cin' => 'L17110GJ1995PLC027025',
                'registration_number' => '027025',
                'business_constitution' => 'PUBLIC_LIMITED',
                'address' => '202, Dev Arc, Opposite Iskon Temple, S. G. Highway, Ahmedabad - 380015, Gujarat, India',
                'phone' => '+91-79-66125500',
                'email' => 'info@aglasiangranito.com',
                'website' => 'https://aglasiangranito.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Simpolo Vitrified Private Limited',
                'trade_name' => 'Simpolo',
                'cin' => 'U26914GJ2007PTC051766',
                'registration_number' => '051766',
                'business_constitution' => 'PRIVATE_LIMITED',
                'address' => 'Office No. 414-416, D Block, Times Square Grand, Sindhu Bhavan Road, Ahmedabad - 380059, Gujarat, India',
                'phone' => '+91-7228922222',
                'email' => 'customercare@simpolo.com',
                'website' => 'https://www.simpolo.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Varmora Granito Limited',
                'trade_name' => 'Varmora',
                'cin' => null,
                'registration_number' => null,
                'business_constitution' => 'LIMITED',
                'address' => '8-A, National Highway, Dhuva, Taluka Wankaner, Rajkot - 363641, Gujarat, India',
                'phone' => '1800-212-0053',
                'email' => null,
                'website' => 'https://varmora.com',
                'verification_status' => 'UNVERIFIED',
                'verified_at' => null,
                'is_active' => true,
            ],

            [
                'legal_name' => 'R.A.K. Ceramics India Private Limited',
                'trade_name' => 'RAK Ceramics',
                'cin' => 'U26919TG2004PTC042401',
                'registration_number' => '042401',
                'business_constitution' => 'PRIVATE_LIMITED',
                'address' => '8-2-350/6/2, 4-B, 4th Floor, Vamsiram Jyothi Square, Road No. 3, Banjara Hills, Hyderabad, Telangana - 500034',
                'phone' => null,
                'email' => null,
                'website' => 'https://www.rakceramics.com/india',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],

            [
                'legal_name' => 'Prism Johnson Limited',
                'trade_name' => 'H&R Johnson',
                'cin' => 'L26942TG1992PLC014033',
                'registration_number' => '014033',
                'business_constitution' => 'PUBLIC_LIMITED',
                'address' => '305, Laxmi Niwas Apartments, Ameerpet, Hyderabad - 500016, Telangana, India',
                'phone' => '+91-22-40647300',
                'email' => 'info@hrjohnsonindia.com',
                'website' => 'https://www.hrjohnsonindia.com',
                'verification_status' => 'VERIFIED',
                'verified_at' => now(),
                'is_active' => true,
            ],
        ];

        foreach ($manufacturers as $manufacturer) {
            Manufacturer::updateOrCreate(
                [
                    'legal_name' => $manufacturer['legal_name'],
                ],
                $manufacturer
            );
        }
    }
}
