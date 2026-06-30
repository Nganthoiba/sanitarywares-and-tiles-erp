<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('report_type'); // inventory, purchase, sales, accounting, granite, audit, etc.
            $table->string('report_name');
            $table->json('filters')->nullable();
            $table->string('export_type')->default('JSON'); // JSON, CSV, Excel, PDF, Print
            $table->decimal('execution_time_ms', 10, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_audit_logs');
    }
};
