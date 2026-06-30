<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('branch_id')->index()->constrained('branches')->onDelete('cascade');
            $table->foreignId('supplier_id')->index()->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('purchase_requisition_id')->index()->nullable()->constrained('purchase_requisitions')->onDelete('set null');
            $table->string('po_number', 50);
            $table->date('po_date');
            $table->decimal('total_amount', 15, 4)->default(0.0000);
            $table->string('status')->default('DRAFT'); // DRAFT, SENT, PARTIALLY_RECEIVED, COMPLETED, CANCELLED
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'po_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('purchase_orders');
    }
};
