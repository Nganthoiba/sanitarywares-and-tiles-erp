<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('product_family_id')->nullable()->index();
            $table->foreignId('category_id')->nullable()->index()->constrained('categories')->onDelete('cascade');
            $table->foreignId('purchase_unit_id')->index()->constrained('units')->onDelete('cascade');
            $table->foreignId('sales_unit_id')->index()->constrained('units')->onDelete('cascade');
            $table->foreignId('base_unit_id')->index()->constrained('units')->onDelete('cascade');
            $table->string('name');
            $table->string('sku', 50);
            $table->string('gtin', 50)->nullable();
            $table->string('barcode', 50)->nullable();
            $table->string('inventory_behavior')->default('STANDARD'); // STANDARD, CONVERTIBLE, SLAB, SERIAL, BATCH, BUNDLE, ROLL
            $table->foreignId('tax_profile_id')->index()->constrained('tax_profiles')->onDelete('cascade');
            $table->foreignId('brand_id')->index()->nullable()->constrained('brands')->onDelete('set null');
            $table->foreignId('manufacturer_id')->index()->nullable()->constrained('manufacturers')->onDelete('set null');
            $table->decimal('cost_price', 15, 4)->default(0.0000);
            $table->decimal('sale_price', 15, 4)->default(0.0000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'sku']);
            $table->index(['organization_id', 'product_family_id']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
