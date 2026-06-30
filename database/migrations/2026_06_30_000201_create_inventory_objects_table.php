<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('storage_location_id')->index()->nullable()->constrained('storage_locations')->onDelete('set null');

            $table->string('object_code', 50); // renamed from slab_code

            // Standard quantities / areas (cached values)
            $table->decimal('quantity', 15, 4)->default(0.0000); // renamed from quantity_on_hand
            $table->decimal('area', 15, 4)->default(0.0000); // renamed from area_on_hand

            $table->string('batch_number', 50)->nullable();
            $table->string('serial_number', 50)->nullable();

            $table->string('status')->default('AVAILABLE');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'product_variant_id']);
            $table->index(['organization_id', 'warehouse_id', 'status']);
            $table->index('object_code');
        });

        Schema::create('granite_slab_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            $table->decimal('length', 10, 2);
            $table->decimal('width', 10, 2);
            $table->decimal('thickness', 10, 2)->default(20.00);
            $table->string('finish', 50)->default('POLISHED');
            $table->string('origin', 50)->default('IMPORT');
            $table->unsignedBigInteger('parent_slab_id')->nullable()->index();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('granite_slab_details');
        Schema::dropIfExists('inventory_objects');
    }
};
