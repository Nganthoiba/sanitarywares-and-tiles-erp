<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'supplier_gstin')) {
                $table->string('supplier_gstin', 20)->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('invoices', 'customer_gstin')) {
                $table->string('customer_gstin', 20)->nullable()->after('supplier_gstin');
            }
            if (!Schema::hasColumn('invoices', 'place_of_supply_state')) {
                $table->string('place_of_supply_state', 100)->nullable()->after('customer_gstin');
            }
            if (!Schema::hasColumn('invoices', 'gst_registration_type')) {
                $table->string('gst_registration_type', 30)->default('UNREGISTERED')->after('place_of_supply_state');
            }
            if (!Schema::hasColumn('invoices', 'supply_type')) {
                $table->string('supply_type', 20)->default('INTRA_STATE')->after('gst_registration_type');
            }
            if (!Schema::hasColumn('invoices', 'invoice_type')) {
                $table->string('invoice_type', 30)->default('REGULAR')->after('supply_type');
            }
            if (!Schema::hasColumn('invoices', 'is_reverse_charge')) {
                $table->boolean('is_reverse_charge')->default(false)->after('invoice_type');
            }
            if (!Schema::hasColumn('invoices', 'is_tax_inclusive')) {
                $table->boolean('is_tax_inclusive')->default(false)->after('is_reverse_charge');
            }
            if (!Schema::hasColumn('invoices', 'round_off_amount')) {
                $table->decimal('round_off_amount', 15, 4)->default(0.0000)->after('due_amount');
            }
            if (!Schema::hasColumn('invoices', 'irn')) {
                $table->string('irn', 100)->nullable()->after('round_off_amount');
            }
            if (!Schema::hasColumn('invoices', 'ack_no')) {
                $table->string('ack_no', 50)->nullable()->after('irn');
            }
            if (!Schema::hasColumn('invoices', 'ack_date')) {
                $table->timestamp('ack_date')->nullable()->after('ack_no');
            }
            if (!Schema::hasColumn('invoices', 'eway_bill_no')) {
                $table->string('eway_bill_no', 50)->nullable()->after('ack_date');
            }
            if (!Schema::hasColumn('invoices', 'eway_bill_date')) {
                $table->timestamp('eway_bill_date')->nullable()->after('eway_bill_no');
            }
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            if (!Schema::hasColumn('invoice_items', 'hsn_sac_code')) {
                $table->string('hsn_sac_code', 20)->nullable()->after('variant_specs_snapshot');
            }
            if (!Schema::hasColumn('invoice_items', 'tax_category')) {
                $table->string('tax_category', 20)->default('TAXABLE')->after('hsn_sac_code');
            }
            if (!Schema::hasColumn('invoice_items', 'is_tax_inclusive')) {
                $table->boolean('is_tax_inclusive')->default(false)->after('tax_category');
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'gst_registration_type')) {
                $table->string('gst_registration_type', 30)->default('UNREGISTERED')->after('gstin');
            }
            if (!Schema::hasColumn('customers', 'state_code')) {
                $table->string('state_code', 5)->nullable()->after('state');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'supplier_gstin', 'customer_gstin', 'place_of_supply_state',
                'gst_registration_type', 'supply_type', 'invoice_type',
                'is_reverse_charge', 'is_tax_inclusive', 'round_off_amount',
                'irn', 'ack_no', 'ack_date', 'eway_bill_no', 'eway_bill_date'
            ]);
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn(['hsn_sac_code', 'tax_category', 'is_tax_inclusive']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['gst_registration_type', 'state_code']);
        });
    }
};
