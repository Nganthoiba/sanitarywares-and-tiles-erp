<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('goods_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('goods_receipt_note_id')->index()->constrained('goods_receipt_notes')->onDelete('cascade');
            $table->foreignId('purchase_order_item_id')->index()->nullable()->constrained('purchase_order_items')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('unit_id')->index()->nullable()->constrained('units')->onDelete('set null');
            
            // Link to newly auto-created inventory object on receipt
            $table->foreignId('inventory_object_id')->index()->nullable()->constrained('inventory_objects')->onDelete('set null');
            
            $table->decimal('quantity_received', 15, 4);
            $table->decimal('quantity_accepted', 15, 4);
            $table->decimal('quantity_rejected', 15, 4)->default(0.0000);
            $table->decimal('unit_price', 15, 4)->nullable();
            $table->string('batch_number', 50)->nullable();
            $table->decimal('received_pricing_quantity', 15, 4)->default(0.0000);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('goods_receipt_item_slabs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('goods_receipt_item_id')->index()->constrained('goods_receipt_items')->onDelete('cascade');
            $table->decimal('length', 10, 2);
            $table->decimal('width', 10, 2);
            $table->decimal('thickness', 10, 2)->default(20.00);
            $table->string('finish', 50)->default('POLISHED');
            $table->string('origin', 50)->default('IMPORT');
            $table->string('slab_code', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('goods_receipt_item_slabs');
        Schema::dropIfExists('goods_receipt_items');
    }
};
