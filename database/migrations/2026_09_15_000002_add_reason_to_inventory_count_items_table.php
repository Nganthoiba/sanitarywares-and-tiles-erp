<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_count_items', function (Blueprint $table) {
            $table->string('reason')->nullable()->after('variance_area');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_count_items', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }
};
