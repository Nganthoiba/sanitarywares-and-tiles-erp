<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->string('source_type'); // SalesOrder, Quotation, etc.
            $table->unsignedBigInteger('source_id');
            $table->unsignedBigInteger('source_item_id'); // e.g. sales_order_item_id
            
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('inventory_object_id')->index()->nullable()->constrained('inventory_objects')->onDelete('set null'); // if specific slab reserved
            
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->decimal('area', 15, 4)->default(0.0000);
            
            $table->string('status')->default('PENDING'); // PENDING, FULFILLED, CANCELLED
            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'source_type', 'source_id'], 'source_reservation_index');
            $table->index(['organization_id', 'product_variant_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('inventory_reservations');
    }
};
