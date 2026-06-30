<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_definition_id')->index();
            $table->integer('version');
            $table->json('configuration')->nullable();
            $table->string('status')->default('DRAFT');
            $table->timestamps();

            $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_versions');
    }
};
