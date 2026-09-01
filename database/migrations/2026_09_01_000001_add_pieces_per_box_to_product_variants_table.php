<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            if (!Schema::hasColumn('product_variants', 'pieces_per_box')) {
                $table->unsignedInteger('pieces_per_box')->nullable()->after('inventory_behavior');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            if (Schema::hasColumn('product_variants', 'pieces_per_box')) {
                $table->dropColumn('pieces_per_box');
            }
        });
    }
};
