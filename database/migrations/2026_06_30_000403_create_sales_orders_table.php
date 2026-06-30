<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('branch_id')->index()->constrained('branches')->onDelete('cascade');
            $table->foreignId('customer_id')->index()->constrained('customers')->onDelete('cascade');
            $table->foreignId('quotation_id')->index()->nullable()->constrained('quotations')->onDelete('set null');
            $table->string('so_number', 50);
            $table->date('so_date');
            $table->decimal('total_amount', 15, 4)->default(0.0000);
            $table->string('status')->default('DRAFT'); // DRAFT, APPROVED, PARTIALLY_DISPATCHED, COMPLETED, CANCELLED
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'so_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('sales_orders');
    }
};
