<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('purchase_requisitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('branch_id')->index()->constrained('branches')->onDelete('cascade');
            $table->string('pr_number', 50);
            $table->foreignId('requested_by')->index()->constrained('users')->onDelete('cascade');
            $table->date('required_date')->nullable();
            $table->string('status')->default('DRAFT'); // DRAFT, PENDING, APPROVED, REJECTED, ORDERED
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'pr_number']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('purchase_requisitions');
    }
};
