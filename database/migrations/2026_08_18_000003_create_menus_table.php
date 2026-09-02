<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('menu_name');
            $table->string('menu_type', 20)->default('PAGE');
            $table->string('route_uri')->nullable();
            $table->string('icon')->nullable();
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('menus')
                ->onDelete('cascade');
            $table->foreignId('permission_id')
                ->nullable()
                ->constrained('permissions')
                ->onDelete('set null');
            $table->integer('order')->default(0);
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
