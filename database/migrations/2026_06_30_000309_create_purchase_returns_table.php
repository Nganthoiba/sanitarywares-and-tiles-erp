<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('supplier_id')->index()->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('supplier_invoice_id')->index()->nullable()->constrained('supplier_invoices')->onDelete('set null');
            $table->string('return_number', 50);
            $table->date('return_date');
            $table->decimal('total_amount', 15, 4)->default(0.0000);
            $table->string('status')->default('PENDING'); // PENDING, COMPLETED, CANCELLED
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'return_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('purchase_returns');
    }
};
