<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventory_objects', function (Blueprint $table) {
            $table->unique(['organization_id', 'object_code'], 'inv_obj_org_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_objects', function (Blueprint $table) {
            $table->dropUnique('inv_obj_org_code_unique');
        });
    }
};
