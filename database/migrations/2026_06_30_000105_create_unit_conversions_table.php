<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('product_variant_id')->index()->nullable()->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('from_unit_id')->index()->constrained('units')->onDelete('cascade');
            $table->foreignId('to_unit_id')->index()->constrained('units')->onDelete('cascade');
            $table->decimal('multiplier', 15, 6);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'product_variant_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('unit_conversions');
    }
};
