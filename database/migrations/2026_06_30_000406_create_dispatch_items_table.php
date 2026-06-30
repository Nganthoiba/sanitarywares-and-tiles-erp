<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('dispatch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('dispatch_id')->index()->constrained('dispatches')->onDelete('cascade');
            $table->foreignId('sales_order_item_id')->index()->constrained('sales_order_items')->onDelete('cascade');
            
            // Link to exact inventory object dispatched (batch or slab)
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            
            $table->decimal('quantity', 15, 4);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('dispatch_items');
    }
};
