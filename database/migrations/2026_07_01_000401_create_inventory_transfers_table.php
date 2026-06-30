<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('from_warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('to_warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->string('transfer_number', 50)->unique();
            $table->date('transfer_date');
            $table->string('status', 50)->default('PENDING'); // PENDING, IN_TRANSIT, RECEIVED, CANCELLED
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->index()->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_transfer_id')->index()->constrained('inventory_transfers')->onDelete('cascade');
            $table->foreignId('inventory_object_id')->index()->constrained('inventory_objects')->onDelete('cascade');
            $table->decimal('quantity', 15, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transfer_items');
        Schema::dropIfExists('inventory_transfers');
    }
};
