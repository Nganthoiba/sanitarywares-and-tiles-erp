<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('account_id')->index()->constrained('accounts')->onDelete('cascade'); // Bank/Cash account
            $table->date('payment_date');
            $table->string('payment_number', 50);
            $table->string('payment_method')->default('CASH'); // CASH, BANK, CHEQUE, UPI
            $table->string('payee_type')->nullable(); // Supplier, etc.
            $table->unsignedBigInteger('payee_id')->nullable();
            $table->decimal('amount', 15, 4);
            $table->string('status')->default('COMPLETED'); // PENDING, COMPLETED, VOID
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'payment_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('payments');
    }
};
