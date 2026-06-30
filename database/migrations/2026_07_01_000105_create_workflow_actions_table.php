<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_definition_id')->index();
            $table->string('name');
            $table->string('action_type')->index(); // approve, reject, allocate_inventory, post_accounting
            $table->json('parameters')->nullable(); // parameters (e.g. email recipient, ledger category)
            $table->timestamps();

            $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_actions');
    }
};
