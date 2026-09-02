<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('parent_id')->index()->nullable()->constrained('categories')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->foreignId('default_base_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->foreignId('default_purchase_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->foreignId('default_sales_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'slug']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
