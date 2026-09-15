<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->string('document_type', 20);
            $table->foreignId('financial_year_id')->nullable()->constrained('financial_years')->onDelete('cascade');
            $table->string('fy_code', 20);
            $table->unsignedBigInteger('current_number')->default(0);
            $table->string('prefix', 20);
            $table->unsignedInteger('padding')->default(6);
            $table->timestamps();

            $table->unique(['organization_id', 'document_type', 'fy_code'], 'doc_seq_org_type_fy_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
