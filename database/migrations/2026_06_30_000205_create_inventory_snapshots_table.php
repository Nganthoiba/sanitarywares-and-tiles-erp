<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            $table->date('snapshot_date');

            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->decimal('area', 15, 4)->default(0.0000);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organization_id', 'warehouse_id', 'product_variant_id', 'snapshot_date'], 'snapshot_unique_index');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('inventory_snapshots');
    }
};
