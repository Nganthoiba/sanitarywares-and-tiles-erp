<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->date('journal_date');
            $table->string('reference_type')->nullable(); // Invoice, GoodReceiptNote, Payment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('narration')->nullable();
            $table->foreignId('created_by')->index()->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'journal_date']);
            $table->index(['reference_type', 'reference_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('journals');
    }
};
