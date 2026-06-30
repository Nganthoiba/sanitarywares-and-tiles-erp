<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sales_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('sales_return_id')->index()->constrained('sales_returns')->onDelete('cascade');
            $table->foreignId('invoice_item_id')->index()->nullable()->constrained('invoice_items')->onDelete('set null');
            
            // Link to the inventory object returned
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            
            $table->decimal('quantity', 15, 4);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('sales_return_items');
    }
};
