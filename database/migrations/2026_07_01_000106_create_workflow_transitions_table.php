<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_transitions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_definition_id')->index();
            $table->unsignedBigInteger('from_step_id')->index();
            $table->unsignedBigInteger('to_step_id')->index();
            $table->unsignedBigInteger('condition_id')->nullable()->index();
            $table->string('name')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->onDelete('cascade');
            $table->foreign('from_step_id')->references('id')->on('workflow_steps')->onDelete('cascade');
            $table->foreign('to_step_id')->references('id')->on('workflow_steps')->onDelete('cascade');
            $table->foreign('condition_id')->references('id')->on('workflow_conditions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_transitions');
    }
};
