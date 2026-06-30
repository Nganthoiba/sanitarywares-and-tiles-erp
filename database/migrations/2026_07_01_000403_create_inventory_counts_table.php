<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_counts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->string('count_number', 50)->unique();
            $table->date('count_date');
            $table->string('count_type', 50)->default('CYCLE'); // CYCLE, ANNUAL, BLIND
            $table->string('status', 50)->default('PENDING'); // PENDING, COMPLETED, APPROVED, CANCELLED
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->index()->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->index()->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_count_id')->index()->constrained('inventory_counts')->onDelete('cascade');
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            $table->decimal('recorded_quantity', 15, 4);
            $table->decimal('counted_quantity', 15, 4);
            $table->decimal('variance_quantity', 15, 4);
            $table->decimal('recorded_area', 15, 4)->default(0.0000);
            $table->decimal('counted_area', 15, 4)->default(0.0000);
            $table->decimal('variance_area', 15, 4)->default(0.0000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_count_items');
        Schema::dropIfExists('inventory_counts');
    }
};
