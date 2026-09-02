<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('goods_receipt_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('storage_location_id')->index()->nullable()->constrained('storage_locations')->onDelete('set null');
            $table->foreignId('purchase_order_id')->index()->nullable()->constrained('purchase_orders')->onDelete('cascade');
            $table->foreignId('supplier_id')->index()->nullable()->constrained('suppliers')->onDelete('set null');
            $table->string('grn_number', 50);
            $table->string('batch_number', 50)->nullable();
            $table->date('received_date');
            $table->string('status')->default('RECEIVED'); // RECEIVED, INSPECTED, PUT_AWAY
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'grn_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('goods_receipt_notes');
    }
};
