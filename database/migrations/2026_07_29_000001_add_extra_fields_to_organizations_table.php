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
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('business_type')->nullable()->after('legal_name');
            $table->string('country')->nullable()->after('business_type');
            $table->string('state')->nullable()->after('country');
            $table->string('city')->nullable()->after('state');
            $table->string('business_registration_number')->nullable()->after('pan');
            $table->json('settings')->nullable()->after('is_active');
            $table->json('preferences')->nullable()->after('settings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'business_type',
                'country',
                'state',
                'city',
                'business_registration_number',
                'settings',
                'preferences'
            ]);
        });
    }
};
