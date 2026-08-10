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
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->date('expected_delivery_date')->nullable()->after('po_date');
            $table->string('reference_number', 100)->nullable()->after('expected_delivery_date');
            $table->text('payment_terms')->nullable()->after('reference_number');
            $table->text('delivery_terms')->nullable()->after('payment_terms');
            $table->decimal('discount_amount', 15, 4)->default(0.0000)->after('total_amount');
            $table->decimal('tax_amount', 15, 4)->default(0.0000)->after('discount_amount');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->decimal('discount_amount', 15, 4)->default(0.0000)->after('unit_price');
            $table->decimal('tax_rate', 15, 4)->default(0.0000)->after('tax_amount');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn(['discount_amount', 'tax_rate']);
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn([
                'expected_delivery_date',
                'reference_number',
                'payment_terms',
                'delivery_terms',
                'discount_amount',
                'tax_amount',
            ]);
        });
    }
};
