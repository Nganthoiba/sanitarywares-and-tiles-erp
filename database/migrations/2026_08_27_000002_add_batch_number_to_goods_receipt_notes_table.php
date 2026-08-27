<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('goods_receipt_notes') && !Schema::hasColumn('goods_receipt_notes', 'batch_number')) {
            Schema::table('goods_receipt_notes', function (Blueprint $table) {
                $table->string('batch_number', 50)->nullable()->after('grn_number');
            });
        }
    }

    public function down(): void {}
};
