<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('product_attribute_id')->index()->constrained('product_attributes')->onDelete('cascade');
            $table->text('value');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'product_variant_id', 'product_attribute_id'], 'variant_attribute_unique');
        });
    }
    public function down(): void {
        Schema::dropIfExists('product_attribute_values');
    }
};
