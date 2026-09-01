<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('category_product_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->foreignId('product_attribute_id')->constrained('product_attributes')->onDelete('cascade');
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('allowed_values')->nullable();
            $table->timestamps();

            $table->unique(['category_id', 'product_attribute_id'], 'cat_attr_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_product_attributes');
    }
};
