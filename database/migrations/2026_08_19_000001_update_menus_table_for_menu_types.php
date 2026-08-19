<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            if (!Schema::hasColumn('menus', 'menu_type')) {
                $table->string('menu_type', 20)->default('PAGE')->after('menu_name');
            }
            $table->string('route_uri')->nullable()->change();
            if (Schema::hasColumn('menus', 'group_name')) {
                $table->dropColumn('group_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            if (Schema::hasColumn('menus', 'menu_type')) {
                $table->dropColumn('menu_type');
            }
            $table->string('route_uri')->nullable(false)->change();
            if (!Schema::hasColumn('menus', 'group_name')) {
                $table->string('group_name')->nullable();
            }
        });
    }
};
