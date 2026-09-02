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
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('business_type')->nullable();
            $table->string('country')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();

            $table->string('gstin', 20)->nullable();
            $table->string('pan', 20)->nullable();
            $table->string('business_registration_number')->nullable();

            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('website')->nullable();
            $table->text('address')->nullable();

            $table->string('subscription_plan')->nullable();
            $table->date('subscription_start')->nullable();
            $table->date('subscription_expiry')->nullable();

            $table->boolean('is_active')->default(true);
            $table->text('suspension_reason')->nullable();
            $table->json('settings')->nullable();
            $table->json('preferences')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
