<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_definition_id')->index();
            $table->string('name');
            $table->string('step_type')->index(); // START, APPROVAL, TASK, CONDITION, PARALLEL, JOIN, END
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->integer('width')->default(150);
            $table->integer('height')->default(80);
            $table->string('blade_view')->nullable();
            $table->string('workflow_action')->nullable();
            $table->json('metadata')->nullable(); // configuration for this specific step (e.g. roles allowed to approve)
            $table->timestamps();

            $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};
