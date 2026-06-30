<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('inventory_reservation_id')->index()->constrained('inventory_reservations')->onDelete('cascade');
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade'); // exact slab/batch allocated

            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->decimal('area', 15, 4)->default(0.0000);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'inventory_reservation_id'], 'inv_alloc_res_idx');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('inventory_allocations');
    }
};
