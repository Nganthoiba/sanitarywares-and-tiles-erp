<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('source_id')->nullable()->change();
            $table->unsignedBigInteger('source_item_id')->nullable()->change();
            $table->string('reservation_number', 50)->nullable()->index()->after('id');
            $table->foreignId('warehouse_id')->nullable()->index()->after('product_variant_id')->constrained('warehouses')->onDelete('set null');
            $table->foreignId('storage_location_id')->nullable()->index()->after('warehouse_id')->constrained('storage_locations')->onDelete('set null');
            $table->foreignId('customer_id')->nullable()->index()->after('storage_location_id')->constrained('customers')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->index()->after('customer_id')->constrained('users')->onDelete('set null');
            $table->timestamp('reservation_date')->nullable()->after('area');
            $table->timestamp('expires_at')->nullable()->after('reservation_date');
            $table->string('reference_number')->nullable()->after('expires_at');
            $table->text('remarks')->nullable()->after('reference_number');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropForeign(['storage_location_id']);
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn([
                'reservation_number',
                'warehouse_id',
                'storage_location_id',
                'customer_id',
                'created_by',
                'reservation_date',
                'expires_at',
                'reference_number',
                'remarks',
            ]);
        });
    }
};
