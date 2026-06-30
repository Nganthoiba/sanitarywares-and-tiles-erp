<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('closing_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('financial_year_id')->index();
            $table->unsignedBigInteger('journal_id'); // links to the closing journal transaction entry closing the accounts
            $table->string('closed_by');
            $table->timestamps();

            $table->foreign('financial_year_id')->references('id')->on('financial_years')->onDelete('cascade');
        });

        Schema::create('daily_ledger_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('account_id')->index()->constrained('accounts')->onDelete('cascade');
            $table->date('snapshot_date');
            $table->decimal('debit_balance', 15, 4)->default(0.0000);
            $table->decimal('credit_balance', 15, 4)->default(0.0000);
            $table->timestamps();

            $table->unique(['organization_id', 'account_id', 'snapshot_date'], 'org_account_snapshot_date_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_ledger_snapshots');
        Schema::dropIfExists('closing_entries');
    }
};
