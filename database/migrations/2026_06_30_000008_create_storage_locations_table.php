<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('storage_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->string('name');
            $table->string('location_type');
            $table->string('code', 50); // Fully qualified e.g. R1-C2-S3-B4
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'warehouse_id', 'code']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('storage_locations');
    }
};
