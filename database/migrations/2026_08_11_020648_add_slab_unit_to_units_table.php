<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $organizations = DB::table('organizations')->get();

        foreach ($organizations as $org) {
            $exists = DB::table('units')
                ->where('organization_id', $org->id)
                ->where('symbol', 'SLAB')
                ->exists();

            if (!$exists) {
                DB::table('units')->insert([
                    'organization_id' => $org->id,
                    'name' => 'Slab',
                    'symbol' => 'SLAB',
                    'type' => 'QUANTITY',
                    'decimal_places' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('units')->where('symbol', 'SLAB')->delete();
    }
};
