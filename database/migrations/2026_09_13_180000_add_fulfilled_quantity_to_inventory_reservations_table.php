<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->decimal('fulfilled_quantity', 15, 4)->default(0.0000)->after('quantity');
            $table->decimal('fulfilled_area', 15, 4)->default(0.0000)->after('area');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->dropColumn(['fulfilled_quantity', 'fulfilled_area']);
        });
    }
};
