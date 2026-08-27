<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('product_batch_prices')) {
            Schema::create('product_batch_prices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
                $table->foreignId('product_variant_id')->index()->constrained('product_variants')->onDelete('cascade');
                $table->string('batch_number', 50)->index();
                $table->decimal('cost_price', 15, 4)->nullable();
                $table->decimal('sale_price', 15, 4)->nullable();
                $table->foreignId('user_id')->nullable()->index()->constrained('users')->onDelete('set null');
                $table->foreignId('updated_by')->nullable()->index()->constrained('users')->onDelete('set null');
                $table->timestamps();
                $table->softDeletes();

                $table->unique(['organization_id', 'product_variant_id', 'batch_number'], 'variant_batch_org_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_batch_prices');
    }
};
