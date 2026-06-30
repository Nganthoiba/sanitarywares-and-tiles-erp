<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('sales_order_id')->index()->constrained('sales_orders')->onDelete('cascade');
            $table->string('dispatch_number', 50);
            $table->date('dispatch_date');
            $table->string('status')->default('PICKED'); // PICKED, DISPATCHED, DELIVERED
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'dispatch_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('dispatches');
    }
};
