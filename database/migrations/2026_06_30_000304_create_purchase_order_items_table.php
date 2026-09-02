<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('purchase_order_id')->index()->constrained('purchase_orders')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            $table->decimal('quantity', 15, 4);
            $table->decimal('received_quantity', 15, 4)->default(0.0000);
            $table->foreignId('unit_id')->index()->constrained('units')->onDelete('cascade');
            $table->foreignId('pricing_unit_id')->nullable()->index()->constrained('units')->onDelete('set null');
            $table->decimal('pricing_conversion_factor', 15, 6)->nullable();
            $table->decimal('estimated_pricing_quantity', 15, 4)->nullable();
            $table->decimal('received_pricing_quantity', 15, 4)->default(0.0000);
            $table->decimal('unit_price', 15, 4);
            $table->decimal('discount_amount', 15, 4)->default(0.0000);
            $table->decimal('tax_amount', 15, 4)->default(0.0000);
            $table->decimal('tax_rate', 15, 4)->default(0.0000);
            $table->decimal('subtotal', 15, 4);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('purchase_order_items');
    }
};
