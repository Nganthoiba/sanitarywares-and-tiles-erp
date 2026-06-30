<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_instance_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_instance_id')->index();
            $table->unsignedBigInteger('workflow_step_id')->index();
            $table->string('assigned_to')->nullable()->index(); // Role code or user ID
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->default('RUNNING'); // RUNNING, WAITING, COMPLETED, REJECTED
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('workflow_instance_id')->references('id')->on('workflow_instances')->onDelete('cascade');
            $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_instance_steps');
    }
};
