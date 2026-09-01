<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->index()->constrained('organizations')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->string('type')->default('string'); // text, number, list, etc.
            $table->foreignId('unit_id')->nullable()->index()->constrained('units')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'slug']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('product_attributes');
    }
};
