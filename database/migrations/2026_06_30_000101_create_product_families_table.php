<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('product_families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('category_id')->index()->constrained('categories')->onDelete('cascade');
            $table->foreignId('brand_id')->index()->nullable()->constrained('brands')->onDelete('cascade');
            $table->foreignId('tax_profile_id')->index()->nullable()->constrained('tax_profiles')->onDelete('cascade');
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'category_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('product_families');
    }
};
