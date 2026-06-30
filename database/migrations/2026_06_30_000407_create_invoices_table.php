<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('customer_id')->index()->constrained('customers')->onDelete('cascade');
            $table->foreignId('sales_order_id')->index()->nullable()->constrained('sales_orders')->onDelete('set null');
            $table->string('invoice_number', 50);
            $table->date('invoice_date');
            $table->decimal('subtotal', 15, 4)->default(0.0000);
            $table->decimal('tax_amount', 15, 4)->default(0.0000);
            $table->decimal('total_amount', 15, 4)->default(0.0000);
            $table->string('status')->default('UNPAID'); // UNPAID, PARTIALLY_PAID, PAID, CANCELLED
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'invoice_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('invoices');
    }
};
