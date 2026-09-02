<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('manufacturers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('trade_name')->nullable();
            $table->string('cin', 50)->nullable();
            $table->string('registration_number')->nullable();
            $table->string('business_constitution', 50)->nullable();
            $table->text('registered_address')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('status', 20)->default('ACTIVE');
            $table->string('verification_status', 30)->default('UNVERIFIED');
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index('legal_name');
            $table->index('trade_name');
            $table->index('registration_number');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('manufacturers');
    }
};
