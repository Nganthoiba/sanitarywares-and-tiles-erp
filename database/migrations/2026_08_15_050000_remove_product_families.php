<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Add category_id to product_variants as nullable first if it doesn't exist
        if (!Schema::hasColumn('product_variants', 'category_id')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->foreignId('category_id')->nullable()->after('product_family_id')->index()->constrained('categories')->onDelete('cascade');
            });
        }

        // 2. Migrate existing category mappings from product_families
        if (Schema::hasTable('product_families')) {
            DB::table('product_variants')
                ->join('product_families', 'product_variants.product_family_id', '=', 'product_families.id')
                ->update(['product_variants.category_id' => DB::raw('product_families.category_id')]);
        }

        // 3. Fallback: Assign first category if any product has no category
        $firstCategoryId = DB::table('categories')->first()?->id;
        if ($firstCategoryId) {
            DB::table('product_variants')->whereNull('category_id')->update(['category_id' => $firstCategoryId]);
        }

        // 4. Enforce mandatory Brand constraint: Assign default brand if brand_id is null
        $firstBrandId = DB::table('brands')->first()?->id;
        if ($firstBrandId) {
            DB::table('product_variants')->whereNull('brand_id')->update(['brand_id' => $firstBrandId]);
        }

        // 5. Drop the old nullable Brand foreign key constraint if it exists
        try {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->dropForeign(['brand_id']);
            });
        } catch (\Exception $e) {
            // Already dropped or doesn't exist
        }

        // 6. Make category_id and brand_id NOT NULL and add the new Brand foreign key constraint
        Schema::table('product_variants', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable(false)->change();
            $table->foreignId('brand_id')->nullable(false)->change();
            
            // Try setting foreign key, ignore if already set
            try {
                $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            } catch (\Exception $e) {}
        });

        // 7. Drop product_family_id foreign key constraint and column if they exist
        Schema::table('product_variants', function (Blueprint $table) {
            if (Schema::hasColumn('product_variants', 'product_family_id')) {
                try {
                    $table->dropForeign(['product_family_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('product_family_id');
            }
        });

        // 8. Drop product_families table
        Schema::dropIfExists('product_families');
    }

    public function down(): void
    {
        // No rolling back since Product Family is dropped permanently
    }
};
