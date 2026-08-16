<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Modify goods_receipt_notes table
        Schema::table('goods_receipt_notes', function (Blueprint $table) {
            $table->foreignId('purchase_order_id')->nullable()->change();
            $table->foreignId('supplier_id')->nullable()->after('purchase_order_id')->constrained('suppliers')->onDelete('set null');
            $table->foreignId('storage_location_id')->nullable()->after('warehouse_id')->constrained('storage_locations')->onDelete('set null');
        });

        // 2. Modify goods_receipt_items table
        Schema::table('goods_receipt_items', function (Blueprint $table) {
            $table->foreignId('purchase_order_item_id')->nullable()->change();
            $table->foreignId('unit_id')->nullable()->after('product_variant_id')->constrained('units')->onDelete('set null');
        });



        // 3. Create goods_receipt_item_slabs table
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

    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_item_slabs');

        /*
        // First check if the table exists or not
        if (Schema::hasTable('goods_receipt_items')) {
            Schema::table('goods_receipt_items', function (Blueprint $table) {
                $table->dropColumn('unit_id');
                $table->foreignId('purchase_order_item_id')->nullable(false)->change();
            });
        }

        // First check if the table exists or not
        if (Schema::hasTable('goods_receipt_notes')) {
            Schema::table('goods_receipt_notes', function (Blueprint $table) {
                $table->dropColumn(['supplier_id', 'storage_location_id']);
                $table->foreignId('purchase_order_id')->nullable(false)->change();
            });
        }
        */
    }
};
