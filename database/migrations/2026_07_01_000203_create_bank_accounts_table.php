<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('account_id')->index();// link to COA account
            $table->string('bank_name');
            $table->string('branch_name')->nullable();
            $table->string('account_no');
            $table->string('ifsc_code')->nullable();
            $table->string('account_type')->default('SAVINGS'); // SAVINGS, CURRENT, OVERDRAFT
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
