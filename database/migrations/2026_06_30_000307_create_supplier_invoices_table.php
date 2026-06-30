<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('supplier_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('supplier_id')->index()->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('goods_receipt_note_id')->index()->nullable()->constrained('goods_receipt_notes')->onDelete('set null');
            $table->string('invoice_number', 50);
            $table->date('invoice_date');
            $table->decimal('subtotal', 15, 4)->default(0.0000);
            $table->decimal('tax_amount', 15, 4)->default(0.0000);
            $table->decimal('total_amount', 15, 4)->default(0.0000);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'supplier_id', 'invoice_number'], 'supplier_invoice_unique');
        });
    }
    public function down(): void {
        Schema::dropIfExists('supplier_invoices');
    }
};
