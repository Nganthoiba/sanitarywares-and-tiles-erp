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
        if (Schema::hasColumn('tax_profiles', 'organization_id')) {
            Schema::table('tax_profiles', function (Blueprint $table) {
                try {
                    $table->dropForeign(['organization_id']);
                } catch (\Throwable $e) {}
                if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
                    $table->unsignedBigInteger('organization_id')->nullable()->change();
                } else {
                    $table->dropColumn('organization_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
