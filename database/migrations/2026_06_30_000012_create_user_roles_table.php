<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->index()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('user_id')->index()->constrained('users')->onDelete('cascade');
            $table->foreignId('role_id')->index()->constrained('roles')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'user_id', 'role_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('user_roles');
    }
};
