<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('branch_id')->index()->constrained('branches')->onDelete('cascade');
            $table->string('name');
            $table->string('type')->default('MAIN'); // MAIN, GRANITE_YARD, TILE_STORE, SANITARY_STORE
            $table->boolean('is_active')->default(true);
            $table->string('code', 20);
            $table->text('address')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'code']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
