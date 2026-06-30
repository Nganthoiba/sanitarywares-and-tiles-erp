<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('purchase_return_id')->index()->constrained('purchase_returns')->onDelete('cascade');
            $table->foreignId('supplier_invoice_item_id')->index()->nullable()->constrained('supplier_invoice_items')->onDelete('set null');
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            $table->decimal('quantity', 15, 4);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('purchase_return_items');
    }
};
