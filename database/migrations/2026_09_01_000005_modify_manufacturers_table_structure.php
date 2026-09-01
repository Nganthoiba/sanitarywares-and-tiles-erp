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
        if (Schema::hasColumn('manufacturers', 'gstin')) {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'sqlite') {
                try {
                    \Illuminate\Support\Facades\DB::statement('DROP INDEX IF EXISTS manufacturers_gstin_index');
                } catch (\Throwable $e) {
                }
            } else {
                try {
                    Schema::table('manufacturers', function (Blueprint $table) {
                        $table->dropIndex('manufacturers_gstin_index');
                    });
                } catch (\Throwable $e) {
                }
            }

            Schema::table('manufacturers', function (Blueprint $table) {
                $table->dropColumn('gstin');
            });
        }

        Schema::table('manufacturers', function (Blueprint $table) {
            if (Schema::hasColumn('manufacturers', 'registration_no')) {
                $table->dropColumn('registration_no');
            }

            if (!Schema::hasColumn('manufacturers', 'cin')) {
                $table->string('cin', 50)->nullable()->after('name');
            }

            if (!Schema::hasColumn('manufacturers', 'registered_address')) {
                $table->text('registered_address')->nullable()->after('cin');
            }

            if (!Schema::hasColumn('manufacturers', 'status')) {
                $table->string('status', 20)->default('ACTIVE')->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
