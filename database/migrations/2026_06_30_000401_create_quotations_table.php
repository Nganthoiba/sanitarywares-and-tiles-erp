<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('branch_id')->index()->constrained('branches')->onDelete('cascade');
            $table->foreignId('customer_id')->index()->constrained('customers')->onDelete('cascade');
            $table->string('quotation_number', 50);
            $table->date('quotation_date');
            $table->date('expiry_date')->nullable();
            $table->decimal('total_amount', 15, 4)->default(0.0000);
            $table->string('status')->default('DRAFT'); // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'quotation_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('quotations');
    }
};
