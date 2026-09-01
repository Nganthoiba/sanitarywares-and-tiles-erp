<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\OrganizationProductPricing;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPricingPackagingTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Organization $orgB;
    protected User $adminUserA;
    protected User $adminUserB;
    protected User $staffUser;
    protected Category $tileCategory;
    protected Category $graniteCategory;
    protected Brand $brand;
    protected Unit $pcsUnit;
    protected Unit $sqftUnit;
    protected Product $tileProduct;
    protected Product $graniteProduct;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Organizations
        $this->orgA = Organization::create([
            'code' => 'ORGA',
            'name' => 'Organization Alpha',
            'is_active' => true,
        ]);

        $this->orgB = Organization::create([
            'code' => 'ORGB',
            'name' => 'Organization Beta',
            'is_active' => true,
        ]);

        // 2. Create Units
        $this->pcsUnit = Unit::create(['name' => 'Piece', 'symbol' => 'PCS', 'organization_id' => null]);
        $this->sqftUnit = Unit::create(['name' => 'Square Feet', 'symbol' => 'SQFT', 'organization_id' => null]);

        // 3. Create Categories
        $this->tileCategory = Category::create([
            'name' => 'Tiles',
            'slug' => 'tiles',
            'organization_id' => null,
            'is_active' => true,
        ]);

        $this->graniteCategory = Category::create([
            'name' => 'Granite Slab',
            'slug' => 'granite-slab',
            'organization_id' => null,
            'is_active' => true,
        ]);

        // 4. Create Brand
        $this->brand = Brand::create([
            'name' => 'Kajaria',
            'slug' => 'kajaria',
            'organization_id' => $this->orgA->id,
            'is_active' => true,
        ]);

        // 5. Seed Permissions & Create Roles
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        $pricingPermission = Permission::where('slug', 'products.pricing.manage')->first();
        $viewPermission = Permission::where('slug', 'products.view')->first();

        $adminRole = Role::create([
            'slug' => 'administrator',
            'name' => 'Organization Administrator',
            'is_system' => true,
        ]);
        if ($pricingPermission) {
            $adminRole->permissions()->attach($pricingPermission->id, ['organization_id' => $this->orgA->id]);
        }
        if ($viewPermission) {
            $adminRole->permissions()->attach($viewPermission->id, ['organization_id' => $this->orgA->id]);
        }

        $staffRole = Role::create([
            'slug' => 'staff',
            'name' => 'Regular Staff',
            'is_system' => false,
        ]);
        if ($viewPermission) {
            $staffRole->permissions()->attach($viewPermission->id, ['organization_id' => $this->orgA->id]);
        }

        // 6. Create Users
        $this->adminUserA = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Admin Org A',
            'email' => 'admin.a@example.com',
            'password' => bcrypt('password'),
            'default_role_id' => $adminRole->id,
        ]);
        $this->adminUserA->roles()->attach($adminRole->id, ['organization_id' => $this->orgA->id]);

        $this->adminUserB = User::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Admin Org B',
            'email' => 'admin.b@example.com',
            'password' => bcrypt('password'),
            'default_role_id' => $adminRole->id,
        ]);
        $this->adminUserB->roles()->attach($adminRole->id, ['organization_id' => $this->orgB->id]);

        $this->staffUser = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Staff Org A',
            'email' => 'staff.a@example.com',
            'password' => bcrypt('password'),
            'default_role_id' => $staffRole->id,
        ]);
        $this->staffUser->roles()->attach($staffRole->id, ['organization_id' => $this->orgA->id]);

        // 7. Create TaxProfile & Products
        $taxProfile = \App\Domains\Master\Models\TaxProfile::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Standard GST 18%',
            'code' => 'GST18',
            'tax_rate' => 18.00,
            'is_active' => true,
        ]);

        $this->tileProduct = Product::create([
            'organization_id' => $this->orgA->id,
            'category_id' => $this->tileCategory->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $taxProfile->id,
            'name' => 'Kajaria Royal Gold 600x600',
            'sku' => 'KAJ-600-GOLD',
            'purchase_unit_id' => $this->pcsUnit->id,
            'sales_unit_id' => $this->pcsUnit->id,
            'base_unit_id' => $this->pcsUnit->id,
            'inventory_behavior' => 'STANDARD',
            'is_active' => true,
        ]);

        $this->graniteProduct = Product::create([
            'organization_id' => $this->orgA->id,
            'category_id' => $this->graniteCategory->id,
            'brand_id' => $this->brand->id,
            'tax_profile_id' => $taxProfile->id,
            'name' => 'Black Galaxy Granite',
            'sku' => 'BLK-GAL-SLAB',
            'purchase_unit_id' => $this->sqftUnit->id,
            'sales_unit_id' => $this->sqftUnit->id,
            'base_unit_id' => $this->sqftUnit->id,
            'inventory_behavior' => 'SLAB',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function authorized_user_can_set_tile_pricing_and_packaging()
    {
        $response = $this->actingAs($this->adminUserA, 'sanctum')
            ->postJson("/api/product/pricing-packaging/{$this->tileProduct->id}", [
                'cost_price' => 180.00,
                'selling_price' => 250.00,
                'price_basis' => 'PCS',
                'pieces_per_box' => 4,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Commercial pricing & packaging settings saved successfully.',
            ]);

        $this->assertDatabaseHas('organization_product_pricings', [
            'organization_id' => $this->orgA->id,
            'product_variant_id' => $this->tileProduct->id,
            'cost_price' => 180.00,
            'selling_price' => 250.00,
            'price_basis' => 'PCS',
            'pieces_per_box' => 4,
            'is_current' => true,
        ]);
    }

    /** @test */
    public function authorized_user_can_set_granite_pricing_per_sqft_without_box_packaging()
    {
        $response = $this->actingAs($this->adminUserA, 'sanctum')
            ->postJson("/api/product/pricing-packaging/{$this->graniteProduct->id}", [
                'cost_price' => 300.00,
                'selling_price' => 450.00,
                'price_basis' => 'SQFT',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('organization_product_pricings', [
            'organization_id' => $this->orgA->id,
            'product_variant_id' => $this->graniteProduct->id,
            'cost_price' => 300.00,
            'selling_price' => 450.00,
            'price_basis' => 'SQFT',
            'pieces_per_box' => null,
            'is_current' => true,
        ]);
    }

    /** @test */
    public function updating_pricing_deactivates_previous_record_and_preserves_history()
    {
        // 1. First pricing update
        $this->actingAs($this->adminUserA, 'sanctum')
            ->postJson("/api/product/pricing-packaging/{$this->tileProduct->id}", [
                'cost_price' => 180.00,
                'selling_price' => 250.00,
                'price_basis' => 'PCS',
                'pieces_per_box' => 4,
            ]);

        // 2. Second pricing update
        $this->actingAs($this->adminUserA, 'sanctum')
            ->postJson("/api/product/pricing-packaging/{$this->tileProduct->id}", [
                'cost_price' => 190.00,
                'selling_price' => 265.00,
                'price_basis' => 'PCS',
                'pieces_per_box' => 4,
            ]);

        // Assert 2 records exist for this variant: 1 inactive, 1 active
        $this->assertDatabaseCount('organization_product_pricings', 2);

        $this->assertDatabaseHas('organization_product_pricings', [
            'product_variant_id' => $this->tileProduct->id,
            'cost_price' => 180.00,
            'selling_price' => 250.00,
            'is_current' => false,
        ]);

        $this->assertDatabaseHas('organization_product_pricings', [
            'product_variant_id' => $this->tileProduct->id,
            'cost_price' => 190.00,
            'selling_price' => 265.00,
            'is_current' => true,
        ]);
    }

    /** @test */
    public function organization_a_cannot_view_or_modify_organization_b_pricing()
    {
        // User B attempts to edit Org A's product pricing
        $response = $this->actingAs($this->adminUserB, 'sanctum')
            ->postJson("/api/product/pricing-packaging/{$this->tileProduct->id}", [
                'cost_price' => 999.00,
                'selling_price' => 999.00,
            ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function unauthorized_staff_without_permission_cannot_update_pricing()
    {
        $response = $this->actingAs($this->staffUser, 'sanctum')
            ->postJson("/api/product/pricing-packaging/{$this->tileProduct->id}", [
                'cost_price' => 100.00,
                'selling_price' => 150.00,
            ]);

        $response->assertStatus(403);
    }
}
