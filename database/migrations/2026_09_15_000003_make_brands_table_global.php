<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('brands', 'organization_id')) {
            Schema::table('brands', function (Blueprint $table) {
                // Drop foreign key if exists
                $table->dropForeign(['organization_id']);
                $table->dropUnique(['organization_id', 'slug']);
                $table->dropColumn('organization_id');
            });

            Schema::table('brands', function (Blueprint $table) {
                $table->unique('slug');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('brands', 'organization_id')) {
            Schema::table('brands', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('cascade');
                $table->unique(['organization_id', 'slug']);
            });
        }
    }
};
