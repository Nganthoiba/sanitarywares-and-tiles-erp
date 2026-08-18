<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('manufacturers', function (Blueprint $table) {
            if (!Schema::hasColumn('manufacturers', 'legal_name')) {
                $table->string('legal_name')->nullable()->after('id');
            }
            if (!Schema::hasColumn('manufacturers', 'trade_name')) {
                $table->string('trade_name')->nullable()->after('legal_name');
            }
            if (!Schema::hasColumn('manufacturers', 'gstin')) {
                $table->string('gstin', 20)->nullable()->after('trade_name');
            }
            if (!Schema::hasColumn('manufacturers', 'registration_number')) {
                $table->string('registration_number')->nullable()->after('gstin');
            }
            if (!Schema::hasColumn('manufacturers', 'business_constitution')) {
                $table->string('business_constitution', 50)->nullable()->after('registration_number');
            }
            if (!Schema::hasColumn('manufacturers', 'verification_status')) {
                $table->string('verification_status', 30)->default('UNVERIFIED')->after('is_active');
            }
            if (!Schema::hasColumn('manufacturers', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verification_status');
            }
            if (!Schema::hasColumn('manufacturers', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('verified_at')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('manufacturers', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            }
        });

        // 1. Copy existing 'name' into 'legal_name' if legal_name is null
        DB::table('manufacturers')
            ->whereNull('legal_name')
            ->orWhere('legal_name', '')
            ->update(['legal_name' => DB::raw('name')]);

        // 2. Consolidate duplicate manufacturers by GSTIN or normalized legal_name
        $manufacturers = DB::table('manufacturers')->get();
        $grouped = [];

        foreach ($manufacturers as $m) {
            $key = null;
            if (!empty($m->gstin)) {
                $key = 'gstin:' . strtoupper(trim($m->gstin));
            } else if (!empty($m->legal_name)) {
                $key = 'name:' . strtolower(trim($m->legal_name));
            } else if (!empty($m->name)) {
                $key = 'name:' . strtolower(trim($m->name));
            }

            if ($key) {
                $grouped[$key][] = $m;
            }
        }

        foreach ($grouped as $key => $records) {
            if (count($records) > 1) {
                // First record is primary
                $primary = $records[0];
                $duplicateIds = array_map(fn($item) => $item->id, array_slice($records, 1));

                // Re-point product_variants
                if (Schema::hasTable('product_variants')) {
                    DB::table('product_variants')
                        ->whereIn('manufacturer_id', $duplicateIds)
                        ->update(['manufacturer_id' => $primary->id]);
                }

                // Delete duplicate manufacturers
                DB::table('manufacturers')->whereIn('id', $duplicateIds)->delete();
            }
        }

        // 3. Drop organization_id column if present
        if (Schema::hasColumn('manufacturers', 'organization_id')) {
            Schema::table('manufacturers', function (Blueprint $table) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            });
        }

        // 4. Add Indexes for fast search
        Schema::table('manufacturers', function (Blueprint $table) {
            $table->index('legal_name');
            $table->index('trade_name');
            $table->index('gstin');
            $table->index('registration_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manufacturers', function (Blueprint $table) {
            if (!Schema::hasColumn('manufacturers', 'organization_id')) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->onDelete('cascade');
            }
        });
    }
};
