<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->decimal('pricing_conversion_factor', 15, 6)->nullable()->after('pricing_unit_id');
        });

        // Set default 1.0 for existing records
        Illuminate\Support\Facades\DB::table('purchase_order_items')->update([
            'pricing_conversion_factor' => 1.000000
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn('pricing_conversion_factor');
        });
    }
};
