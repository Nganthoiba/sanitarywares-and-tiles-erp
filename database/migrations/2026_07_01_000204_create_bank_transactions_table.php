<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('bank_account_id')->index();
            $table->date('transaction_date');
            $table->string('transaction_type')->index(); // DEPOSIT, WITHDRAW
            $table->decimal('amount', 15, 4);
            $table->string('payment_mode')->default('UPI'); // CHEQUE, NEFT, RTGS, UPI, CARD, CASH
            $table->string('reference_no')->nullable();
            $table->string('status')->default('CLEARED'); // PENDING, CLEARED, BOUNCED
            $table->timestamp('value_date')->nullable();
            $table->timestamps();

            $table->foreign('bank_account_id')->references('id')->on('bank_accounts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
    }
};
