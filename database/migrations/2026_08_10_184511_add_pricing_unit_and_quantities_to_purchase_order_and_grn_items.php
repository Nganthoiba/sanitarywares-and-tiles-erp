<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreignId('pricing_unit_id')->nullable()->after('unit_id')->constrained('units')->onDelete('set null');
            $table->decimal('estimated_pricing_quantity', 15, 4)->nullable()->after('quantity');
            $table->decimal('received_pricing_quantity', 15, 4)->default(0.0000)->after('received_quantity');
        });

        Schema::table('goods_receipt_items', function (Blueprint $table) {
            $table->decimal('received_pricing_quantity', 15, 4)->default(0.0000)->after('quantity_accepted');
        });

        // Seed default values for existing records to ensure backward compatibility
        DB::table('purchase_order_items')->update([
            'pricing_unit_id' => DB::raw('unit_id'),
            'estimated_pricing_quantity' => DB::raw('quantity'),
            'received_pricing_quantity' => DB::raw('received_quantity')
        ]);
    }

    public function down(): void
    {
        Schema::table('goods_receipt_items', function (Blueprint $table) {
            $table->dropColumn('received_pricing_quantity');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropForeign(['pricing_unit_id']);
            $table->dropColumn([
                'pricing_unit_id',
                'estimated_pricing_quantity',
                'received_pricing_quantity',
            ]);
        });
    }
};
