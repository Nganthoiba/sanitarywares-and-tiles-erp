<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GlobalManufacturerTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Organization $orgB;
    protected User $userA;
    protected User $userB;
    protected User $superAdmin;
    protected Role $superAdminRole;
    protected Category $category;
    protected Brand $brand;
    protected Unit $unit;
    protected TaxProfile $taxProfileA;
    protected TaxProfile $taxProfileB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PermissionSeeder::class);

        // 1. Create Organization A & Owner User
        $this->orgA = Organization::create([
            'name' => 'Org Alpha Tiles',
            'code' => 'ALPHA01',
            'is_active' => true
        ]);
        $this->userA = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Owner Alpha',
            'email' => 'alpha@tiles.com',
            'password' => bcrypt('password')
        ]);
        $roleA = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_system' => true
        ]);
        $allPermissions = Permission::pluck('id');
        $roleA->permissions()->syncWithPivotValues($allPermissions, ['organization_id' => $this->orgA->id]);
        $this->userA->roles()->attach($roleA->id, ['organization_id' => $this->orgA->id]);
        $this->userA->default_role_id = $roleA->id;
        $this->userA->save();
        $this->taxProfileA = TaxProfile::create(['organization_id' => $this->orgA->id, 'name' => 'GST 18%', 'cgst_rate' => 9, 'sgst_rate' => 9, 'igst_rate' => 18, 'is_active' => true]);

        // Organization-scoped master data
        $this->category = Category::create(['organization_id' => $this->orgA->id, 'name' => 'Tiles', 'slug' => 'tiles', 'is_active' => true]);
        $this->brand = Brand::create(['organization_id' => $this->orgA->id, 'name' => 'Premium Brand', 'slug' => 'premium-brand', 'is_active' => true]);
        $this->unit = Unit::create(['name' => 'Pieces', 'code' => 'PCS', 'symbol' => 'pcs', 'is_active' => true]);

        // 2. Create Organization B & Owner User
        $this->orgB = Organization::create([
            'name' => 'Org Beta Sanitary',
            'code' => 'BETA01',
            'is_active' => true
        ]);
        $this->userB = User::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Owner Beta',
            'email' => 'beta@sanitary.com',
            'password' => bcrypt('password')
        ]);
        $roleB = Role::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_system' => true
        ]);
        $roleB->permissions()->syncWithPivotValues($allPermissions, ['organization_id' => $this->orgB->id]);
        $this->userB->roles()->attach($roleB->id, ['organization_id' => $this->orgB->id]);
        $this->userB->default_role_id = $roleB->id;
        $this->userB->save();
        $this->taxProfileB = TaxProfile::create(['organization_id' => $this->orgB->id, 'name' => 'GST 18%', 'cgst_rate' => 9, 'sgst_rate' => 9, 'igst_rate' => 18, 'is_active' => true]);

        // 3. Create Super Admin User (platform-scoped, organization_id = NULL)
        $this->superAdminRole = Role::create([
            'organization_id' => null,
            'name' => 'Super Administrator',
            'slug' => 'super-admin',
            'is_system' => true
        ]);
        $this->superAdmin = User::create([
            'organization_id' => null,
            'name' => 'Super Admin',
            'email' => 'super@admin.com',
            'password' => bcrypt('password')
        ]);
        $this->superAdmin->organization_id = null;
        $this->superAdmin->save();
        $this->superAdmin->roles()->attach($this->superAdminRole->id, ['organization_id' => null]);
    }

    public function test_super_admin_can_create_update_and_delete_global_manufacturer()
    {
        $token = $this->superAdmin->createToken('test')->plainTextToken;

        // 1. Create
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Kajaria Ceramics Limited',
                'trade_name' => 'Kajaria',
                'gstin' => '27AAACK1234F1Z5',
                'registration_number' => 'REG-KAJ-9988',
                'business_constitution' => 'Public Limited',
                'address' => 'Andheri East, Mumbai',
                'phone' => '022-12345678',
                'email' => 'info@kajaria.com',
                'website' => 'https://www.kajariaceramics.com'
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('manufacturer.legal_name', 'Kajaria Ceramics Limited')
            ->assertJsonPath('manufacturer.gstin', '27AAACK1234F1Z5');

        $id = $response->json('manufacturer.id');

        // Verify Database
        $this->assertDatabaseHas('manufacturers', [
            'id' => $id,
            'legal_name' => 'Kajaria Ceramics Limited',
            'gstin' => '27AAACK1234F1Z5'
        ]);

        // 2. Update
        $updateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/manufacturers-crud/{$id}", [
                'trade_name' => 'Kajaria Tiles & Ceramics',
                'verification_status' => 'VERIFIED'
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('manufacturer.trade_name', 'Kajaria Tiles & Ceramics')
            ->assertJsonPath('manufacturer.verification_status', 'VERIFIED');

        // 3. Delete
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/manufacturers-crud/{$id}");

        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('manufacturers', ['id' => $id]);
    }

    public function test_org_admin_with_permission_can_create_manufacturer()
    {
        $tokenA = $this->userA->createToken('test')->plainTextToken;

        // Org Admin has manufacturer.create permission (via administrator role)
        $createResponse = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Somany Ceramics Limited',
                'trade_name' => 'Somany',
                'gstin' => '27AAACS9012H1Z9'
            ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('manufacturer.legal_name', 'Somany Ceramics Limited');
    }

    public function test_staff_without_permission_cannot_create_update_or_delete()
    {
        $mfg = Manufacturer::create([
            'legal_name' => 'Jaquar & Company Pvt Ltd',
            'trade_name' => 'Jaquar',
            'gstin' => '06AAACJ9012H1Z9'
        ]);

        // Create regular staff user with staff role (no manufacturer permissions)
        $staffRole = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Staff',
            'slug' => 'staff',
            'is_system' => false
        ]);
        $staffUser = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Staff User',
            'email' => 'staff@tiles.com',
            'password' => bcrypt('password'),
            'default_role_id' => $staffRole->id
        ]);
        $staffUser->roles()->attach($staffRole->id, ['organization_id' => $this->orgA->id]);

        $tokenStaff = $staffUser->createToken('test')->plainTextToken;

        // 1. Create -> Forbidden for Staff without permission (403)
        $createResponse = $this->withHeader('Authorization', "Bearer {$tokenStaff}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Unauthorized New Manufacturer',
                'gstin' => '27AAACJ9012H1Z9'
            ]);
        $createResponse->assertStatus(403);

        // 2. Update -> Forbidden for Staff without permission (403)
        $updateResponse = $this->withHeader('Authorization', "Bearer {$tokenStaff}")
            ->putJson("/api/manufacturers-crud/{$mfg->id}", [
                'legal_name' => 'Unauthorized Update Name'
            ]);

        $updateResponse->assertStatus(403);

        // 3. Delete -> Forbidden for Staff without permission (403)
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$tokenStaff}")
            ->deleteJson("/api/manufacturers-crud/{$mfg->id}");

        $deleteResponse->assertStatus(403);
    }

    public function test_duplicate_gstin_detection()
    {
        Manufacturer::create([
            'legal_name' => 'Kajaria Ceramics Limited',
            'gstin' => '27AAACK1234F1Z5'
        ]);

        $token = $this->superAdmin->createToken('test')->plainTextToken;

        // Try to create another manufacturer with the same GSTIN
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Kajaria Duplicate Entry',
                'gstin' => '27aaack1234f1z5'
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('duplicate_type', 'exact_gstin');
    }

    public function test_organizations_can_create_products_referencing_same_global_manufacturer()
    {
        $mfg = Manufacturer::create([
            'legal_name' => 'Shared Global Manufacturer Ltd',
            'trade_name' => 'SharedMfg',
            'is_active' => true
        ]);

        // Org A creates product referencing global $mfg
        Sanctum::actingAs($this->userA);
        $prodA = $this->postJson('/api/product/variants', [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Polished Vitrified Tile 600x600',
            'sku' => 'PVT-6060-01',
            'manufacturer_id' => $mfg->id,
            'purchase_unit_id' => $this->unit->id,
            'sales_unit_id' => $this->unit->id,
            'base_unit_id' => $this->unit->id,
            'tax_profile_id' => $this->taxProfileA->id,
            'min_stock' => 10,
        ]);
        $prodA->assertStatus(201);

        // Org B creates product referencing same global $mfg
        Sanctum::actingAs($this->userB);
        $categoryB = Category::create(['organization_id' => $this->orgB->id, 'name' => 'Sanitary', 'slug' => 'sanitary', 'is_active' => true]);
        $brandB = Brand::create(['organization_id' => $this->orgB->id, 'name' => 'Beta Brand', 'slug' => 'beta-brand', 'is_active' => true]);

        $prodB = $this->postJson('/api/product/variants', [
            'category_id' => $categoryB->id,
            'brand_id' => $brandB->id,
            'name' => 'Glazed Ceramic Tile 300x600',
            'sku' => 'GCT-3060-01',
            'manufacturer_id' => $mfg->id,
            'purchase_unit_id' => $this->unit->id,
            'sales_unit_id' => $this->unit->id,
            'base_unit_id' => $this->unit->id,
            'tax_profile_id' => $this->taxProfileB->id,
            'min_stock' => 5,
        ]);
        $prodB->assertStatus(201);

        // Verify products belong to different orgs but share manufacturer
        $prodAId = $prodA->json('data.id');
        $prodBId = $prodB->json('data.id');

        $this->assertDatabaseHas('product_variants', [
            'id' => $prodAId,
            'organization_id' => $this->orgA->id,
            'manufacturer_id' => $mfg->id
        ]);

        $this->assertDatabaseHas('product_variants', [
            'id' => $prodBId,
            'organization_id' => $this->orgB->id,
            'manufacturer_id' => $mfg->id
        ]);
    }

    public function test_cannot_delete_manufacturer_referenced_by_products()
    {
        $mfg = Manufacturer::create([
            'legal_name' => 'Referenced Manufacturer Ltd',
            'is_active' => true
        ]);

        // Create product referencing $mfg
        Sanctum::actingAs($this->userA);
        $this->postJson('/api/product/variants', [
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'name' => 'Sanitary Basin White',
            'sku' => 'SBW-01',
            'manufacturer_id' => $mfg->id,
            'purchase_unit_id' => $this->unit->id,
            'sales_unit_id' => $this->unit->id,
            'base_unit_id' => $this->unit->id,
            'tax_profile_id' => $this->taxProfileA->id,
        ])->assertStatus(201);

        // Super Admin attempts to delete referenced manufacturer
        Sanctum::actingAs($this->superAdmin);
        $response = $this->deleteJson("/api/manufacturers-crud/{$mfg->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot delete manufacturer because it is referenced by active products. Deactivate instead.');
    }
}
