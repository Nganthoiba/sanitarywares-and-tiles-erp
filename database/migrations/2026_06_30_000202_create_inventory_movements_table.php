<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $driver = \Illuminate\Support\Facades\DB::getDriverName();

        Schema::create('inventory_movements', function (Blueprint $table) use ($driver) {
            if ($driver === 'mysql') {
                $table->bigInteger('id');
            } else {
                $table->id();
            }
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('inventory_object_id')->index();
            $table->string('movement_type'); // PURCHASE, SALE, RETURN, TRANSFER, ADJUSTMENT, DAMAGE, ALLOCATION, REALLOCATION

            $table->decimal('quantity_delta', 15, 4)->default(0.0000);
            $table->decimal('area_delta', 15, 4)->default(0.0000);

            $table->unsignedBigInteger('from_warehouse_id')->nullable()->index();
            $table->unsignedBigInteger('to_warehouse_id')->nullable()->index();
            $table->unsignedBigInteger('from_storage_location_id')->nullable()->index();
            $table->unsignedBigInteger('to_storage_location_id')->nullable()->index();

            // Source document details
            $table->string('reference_type')->nullable(); // GoodReceiptNote, Invoice, etc.
            $table->unsignedBigInteger('reference_id')->nullable();

            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();

            $table->index(['organization_id', 'inventory_object_id']);
            $table->index(['reference_type', 'reference_id']);
            if ($driver === 'mysql') {
                $table->primary(['id', 'created_at']);
            }
        });

        // Set auto_increment for primary key column and apply partition by range columns on created_at for MySQL
        if ($driver === 'mysql') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE inventory_movements MODIFY id BIGINT NOT NULL AUTO_INCREMENT');
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE inventory_movements PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
                PARTITION p_2026_06 VALUES LESS THAN (UNIX_TIMESTAMP('2026-07-01 00:00:00')),
                PARTITION p_2026_07 VALUES LESS THAN (UNIX_TIMESTAMP('2026-08-01 00:00:00')),
                PARTITION p_2026_08 VALUES LESS THAN (UNIX_TIMESTAMP('2026-09-01 00:00:00')),
                PARTITION p_2026_09 VALUES LESS THAN (UNIX_TIMESTAMP('2026-10-01 00:00:00')),
                PARTITION p_max VALUES LESS THAN MAXVALUE
            )");
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
