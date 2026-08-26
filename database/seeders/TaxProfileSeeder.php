<?php

namespace Database\Seeders;

use App\Domains\Master\Models\TaxProfile;
use App\Library\Database\AutoIncrement;
use Illuminate\Database\Seeder;

class TaxProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            ['id' => 1, 'name' => 'GST 18%', 'hsn_code' => '6907', 'cgst_rate' => 9.00, 'sgst_rate' => 9.00, 'igst_rate' => 18.00, 'is_active' => true],
            ['id' => 2, 'name' => 'GST 28%', 'hsn_code' => '6910', 'cgst_rate' => 14.00, 'sgst_rate' => 14.00, 'igst_rate' => 28.00, 'is_active' => true],
            ['id' => 3, 'name' => 'GST 12%', 'hsn_code' => '6802', 'cgst_rate' => 6.00, 'sgst_rate' => 6.00, 'igst_rate' => 12.00, 'is_active' => true],
            ['id' => 4, 'name' => 'GST 5%', 'hsn_code' => '2523', 'cgst_rate' => 2.50, 'sgst_rate' => 2.50, 'igst_rate' => 5.00, 'is_active' => true],
        ];

        TaxProfile::upsert($profiles, ['id'], ['name', 'hsn_code', 'cgst_rate', 'sgst_rate', 'igst_rate', 'is_active']);
        AutoIncrement::resetIndex('tax_profiles', 'id');
    }
}

