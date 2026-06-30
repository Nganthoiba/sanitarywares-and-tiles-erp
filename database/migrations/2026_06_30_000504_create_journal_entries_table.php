<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('journal_id')->index()->constrained('journals')->onDelete('cascade');
            $table->foreignId('account_id')->index()->constrained('accounts')->onDelete('cascade');
            $table->string('entry_type'); // DEBIT, CREDIT
            $table->decimal('amount', 15, 4);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'account_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('journal_entries');
    }
};
