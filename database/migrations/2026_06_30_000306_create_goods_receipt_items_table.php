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
            $table->foreignId('purchase_order_item_id')->index()->constrained('purchase_order_items')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            
            // Link to newly auto-created inventory object on receipt
            $table->foreignId('inventory_object_id')->index()->nullable()->constrained('inventory_objects')->onDelete('set null');
            
            $table->integer('quantity_received');
            $table->integer('quantity_accepted');
            $table->integer('quantity_rejected')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        \Illuminate\Support\Facades\DB::statement('DROP TABLE IF EXISTS goods_receipt_items CASCADE;');
    }
};
