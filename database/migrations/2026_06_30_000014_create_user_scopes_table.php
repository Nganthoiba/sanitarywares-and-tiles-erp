<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('user_scopes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('user_id')->index()->constrained('users')->onDelete('cascade');
            $table->foreignId('branch_id')->index()->nullable()->constrained('branches')->onDelete('cascade');
            $table->foreignId('warehouse_id')->index()->nullable()->constrained('warehouses')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'user_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('user_scopes');
    }
};
