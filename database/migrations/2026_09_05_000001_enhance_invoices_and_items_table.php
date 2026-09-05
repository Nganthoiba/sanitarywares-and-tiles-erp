<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'warehouse_id')) {
                $table->foreignId('warehouse_id')->nullable()->after('sales_order_id')->constrained('warehouses')->onDelete('set null');
            }
            if (!Schema::hasColumn('invoices', 'discount_amount')) {
                $table->decimal('discount_amount', 15, 4)->default(0.0000)->after('subtotal');
            }
            if (!Schema::hasColumn('invoices', 'taxable_amount')) {
                $table->decimal('taxable_amount', 15, 4)->default(0.0000)->after('discount_amount');
            }
            if (!Schema::hasColumn('invoices', 'cgst_amount')) {
                $table->decimal('cgst_amount', 15, 4)->default(0.0000)->after('tax_amount');
            }
            if (!Schema::hasColumn('invoices', 'sgst_amount')) {
                $table->decimal('sgst_amount', 15, 4)->default(0.0000)->after('cgst_amount');
            }
            if (!Schema::hasColumn('invoices', 'igst_amount')) {
                $table->decimal('igst_amount', 15, 4)->default(0.0000)->after('sgst_amount');
            }
            if (!Schema::hasColumn('invoices', 'paid_amount')) {
                $table->decimal('paid_amount', 15, 4)->default(0.0000)->after('total_amount');
            }
            if (!Schema::hasColumn('invoices', 'due_amount')) {
                $table->decimal('due_amount', 15, 4)->default(0.0000)->after('paid_amount');
            }
            if (!Schema::hasColumn('invoices', 'payment_status')) {
                $table->string('payment_status', 30)->default('UNPAID')->after('status');
            }
            if (!Schema::hasColumn('invoices', 'payment_method')) {
                $table->string('payment_method', 50)->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('invoices', 'notes')) {
                $table->text('notes')->nullable()->after('payment_method');
            }
            if (!Schema::hasColumn('invoices', 'billing_address')) {
                $table->text('billing_address')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('invoices', 'shipping_address')) {
                $table->text('shipping_address')->nullable()->after('billing_address');
            }
            if (!Schema::hasColumn('invoices', 'is_direct_sale')) {
                $table->boolean('is_direct_sale')->default(false)->after('shipping_address');
            }
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            if (!Schema::hasColumn('invoice_items', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->after('product_variant_id')->constrained('units')->onDelete('set null');
            }
            if (!Schema::hasColumn('invoice_items', 'price_basis')) {
                $table->string('price_basis', 20)->nullable()->after('unit_id');
            }
            if (!Schema::hasColumn('invoice_items', 'discount_amount')) {
                $table->decimal('discount_amount', 15, 4)->default(0.0000)->after('unit_price');
            }
            if (!Schema::hasColumn('invoice_items', 'taxable_amount')) {
                $table->decimal('taxable_amount', 15, 4)->default(0.0000)->after('discount_amount');
            }
            if (!Schema::hasColumn('invoice_items', 'tax_rate')) {
                $table->decimal('tax_rate', 8, 2)->default(0.00)->after('taxable_amount');
            }
            if (!Schema::hasColumn('invoice_items', 'cgst_rate')) {
                $table->decimal('cgst_rate', 8, 2)->default(0.00)->after('tax_rate');
            }
            if (!Schema::hasColumn('invoice_items', 'cgst_amount')) {
                $table->decimal('cgst_amount', 15, 4)->default(0.0000)->after('cgst_rate');
            }
            if (!Schema::hasColumn('invoice_items', 'sgst_rate')) {
                $table->decimal('sgst_rate', 8, 2)->default(0.00)->after('cgst_amount');
            }
            if (!Schema::hasColumn('invoice_items', 'sgst_amount')) {
                $table->decimal('sgst_amount', 15, 4)->default(0.0000)->after('sgst_rate');
            }
            if (!Schema::hasColumn('invoice_items', 'igst_rate')) {
                $table->decimal('igst_rate', 8, 2)->default(0.00)->after('sgst_amount');
            }
            if (!Schema::hasColumn('invoice_items', 'igst_amount')) {
                $table->decimal('igst_amount', 15, 4)->default(0.0000)->after('igst_rate');
            }
            if (!Schema::hasColumn('invoice_items', 'product_name_snapshot')) {
                $table->string('product_name_snapshot')->nullable()->after('subtotal');
            }
            if (!Schema::hasColumn('invoice_items', 'sku_snapshot')) {
                $table->string('sku_snapshot')->nullable()->after('product_name_snapshot');
            }
            if (!Schema::hasColumn('invoice_items', 'variant_specs_snapshot')) {
                $table->json('variant_specs_snapshot')->nullable()->after('sku_snapshot');
            }
        });

        Schema::table('dispatches', function (Blueprint $table) {
            if (!Schema::hasColumn('dispatches', 'invoice_id')) {
                $table->foreignId('invoice_id')->nullable()->after('sales_order_id')->constrained('invoices')->onDelete('set null');
            }
            // Allow sales_order_id to be nullable for direct sales dispatches
            $table->foreignId('sales_order_id')->nullable()->change();
        });

        Schema::table('dispatch_items', function (Blueprint $table) {
            if (!Schema::hasColumn('dispatch_items', 'product_variant_id')) {
                $table->foreignId('product_variant_id')->nullable()->after('dispatch_id')->constrained('product_variants')->onDelete('set null');
            }
            if (!Schema::hasColumn('dispatch_items', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->after('product_variant_id')->constrained('units')->onDelete('set null');
            }
            $table->foreignId('sales_order_item_id')->nullable()->change();
            $table->foreignId('inventory_object_id')->nullable()->change();
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'state')) {
                $table->string('state', 100)->nullable()->after('address');
            }
            if (!Schema::hasColumn('customers', 'city')) {
                $table->string('city', 100)->nullable()->after('state');
            }
            if (!Schema::hasColumn('customers', 'pincode')) {
                $table->string('pincode', 20)->nullable()->after('city');
            }
        });
    }

    public function down(): void {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'warehouse_id', 'discount_amount', 'taxable_amount', 'cgst_amount',
                'sgst_amount', 'igst_amount', 'paid_amount', 'due_amount',
                'payment_status', 'payment_method', 'notes', 'billing_address',
                'shipping_address', 'is_direct_sale'
            ]);
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn([
                'unit_id', 'price_basis', 'discount_amount', 'taxable_amount',
                'tax_rate', 'cgst_rate', 'cgst_amount', 'sgst_rate', 'sgst_amount',
                'igst_rate', 'igst_amount', 'product_name_snapshot', 'sku_snapshot',
                'variant_specs_snapshot'
            ]);
        });

        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
            $table->dropColumn(['invoice_id']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['state', 'city', 'pincode']);
        });
    }
};
