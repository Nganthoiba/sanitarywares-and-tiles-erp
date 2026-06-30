<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('account_id')->index()->constrained('accounts')->onDelete('cascade'); // Bank/Cash account
            $table->date('receipt_date');
            $table->string('receipt_number', 50);
            $table->string('payment_method')->default('CASH'); // CASH, BANK, UPI, CHEQUE
            $table->string('payer_type')->nullable(); // Customer, etc.
            $table->unsignedBigInteger('payer_id')->nullable();
            $table->decimal('amount', 15, 4);
            $table->string('status')->default('COMPLETED'); // COMPLETED, VOID
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'receipt_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('receipts');
    }
};
