<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('organization_product_pricings')) {
            Schema::create('organization_product_pricings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
                $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
                $table->decimal('cost_price', 12, 4)->nullable();
                $table->decimal('selling_price', 12, 4)->nullable();
                $table->string('price_basis', 50)->default('PCS'); // PCS, SQFT, BOX, BAG, KG
                $table->foreignId('price_basis_unit_id')->nullable()->index()->constrained('units')->onDelete('set null');
                $table->unsignedInteger('pieces_per_box')->nullable(); // Current commercial packaging for tiles
                $table->decimal('package_weight_kg', 10, 2)->nullable(); // Current commercial packaging for bagged items
                $table->timestamp('effective_from')->useCurrent();
                $table->timestamp('effective_to')->nullable();
                $table->boolean('is_current')->default(true)->index();
                $table->foreignId('created_by_user_id')->nullable()->index()->constrained('users')->onDelete('set null');
                $table->foreignId('updated_by_user_id')->nullable()->index()->constrained('users')->onDelete('set null');
                $table->timestamps();
                $table->softDeletes();

                $table->index(['organization_id', 'product_variant_id', 'is_current'], 'org_variant_current_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_product_pricings');
    }
};
