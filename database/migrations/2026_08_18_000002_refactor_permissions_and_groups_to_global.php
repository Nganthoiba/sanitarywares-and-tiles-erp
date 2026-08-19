<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('permission_groups', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropUnique(['organization_id', 'name']);
            $table->dropColumn('organization_id');
            $table->boolean('enabled')->default(true)->after('name');
            $table->unique(['name']);
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropUnique(['organization_id', 'slug']);
            $table->dropColumn('organization_id');
            $table->string('display_name')->nullable()->after('name');
            $table->text('description')->nullable()->after('display_name');
            $table->boolean('enabled')->default(true)->after('slug');
            $table->unique(['slug']);
        });

        Schema::table('role_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('organization_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('organization_id')->nullable(false)->change();
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['display_name', 'description', 'enabled']);
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('cascade');
        });

        Schema::table('permission_groups', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropColumn('enabled');
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('cascade');
        });
    }
};
