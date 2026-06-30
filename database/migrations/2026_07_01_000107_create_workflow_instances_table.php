<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_instances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_definition_id')->index();
            $table->string('reference_type')->index(); // e.g. App\Domains\Purchase\Models\PurchaseOrder
            $table->unsignedBigInteger('reference_id')->index(); // target model primary key
            $table->unsignedBigInteger('current_step_id')->nullable();
            $table->string('status')->default('RUNNING')->index(); // RUNNING, WAITING, APPROVED, REJECTED, COMPLETED, CANCELLED, FAILED
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_instances');
    }
};
