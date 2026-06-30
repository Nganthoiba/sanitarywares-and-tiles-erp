<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            $table->string('valuation_method', 50); // FIFO, LIFO, WAC, SPECIFIC_ID
            $table->decimal('unit_cost', 15, 4);
            $table->decimal('total_value', 15, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_valuations');
    }
};
