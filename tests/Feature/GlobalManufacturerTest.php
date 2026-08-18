<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Unit;
use App\Domains\Product\Models\Product;
use App\Domains\Security\Models\Role;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GlobalManufacturerTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Organization $orgB;
    protected User $userA;
    protected User $userB;
    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Org A
        $this->orgA = Organization::create([
            'name' => 'Org A',
            'code' => 'ORGA01',
            'is_active' => true
        ]);

        $roleA = Role::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_system' => true
        ]);

        $this->userA = User::create([
            'organization_id' => $this->orgA->id,
            'default_role_id' => $roleA->id,
            'name' => 'User Org A',
            'email' => 'admin@orga.com',
            'password' => bcrypt('password123')
        ]);
        $this->userA->roles()->attach($roleA->id, ['organization_id' => $this->orgA->id]);

        // Create Org B
        $this->orgB = Organization::create([
            'name' => 'Org B',
            'code' => 'ORGB01',
            'is_active' => true
        ]);

        $roleB = Role::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_system' => true
        ]);

        $this->userB = User::create([
            'organization_id' => $this->orgB->id,
            'default_role_id' => $roleB->id,
            'name' => 'User Org B',
            'email' => 'admin@orgb.com',
            'password' => bcrypt('password123')
        ]);
        $this->userB->roles()->attach($roleB->id, ['organization_id' => $this->orgB->id]);

        // Seed Super Admin
        $this->seed(SuperAdminSeeder::class);
        $this->superAdmin = User::where('email', 'smartnotification1@gmail.com')->first();
    }

    public function test_super_admin_seeder_creates_user_with_correct_credentials_and_role()
    {
        $this->assertNotNull($this->superAdmin);
        $this->assertEquals('smartnotification1@gmail.com', $this->superAdmin->email);
        $this->assertTrue($this->superAdmin->roles()->withoutGlobalScopes()->get()->contains('slug', 'super-admin'));
    }

    public function test_manufacturer_exists_globally_without_organization_id()
    {
        $mfg = Manufacturer::create([
            'legal_name' => 'Kajaria Ceramics Limited',
            'trade_name' => 'Kajaria',
            'gstin' => '27AAACK1234F1Z5',
            'is_active' => true
        ]);

        $this->assertDatabaseHas('manufacturers', [
            'id' => $mfg->id,
            'legal_name' => 'Kajaria Ceramics Limited',
            'gstin' => '27AAACK1234F1Z5',
        ]);

        // Verify manufacturer model has no organization relationship
        $this->assertFalse(method_exists($mfg, 'organization'));
    }

    public function test_super_admin_has_full_crud_on_global_manufacturers()
    {
        $token = $this->superAdmin->createToken('test')->plainTextToken;

        // 1. Create
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Somany Ceramics Ltd',
                'trade_name' => 'Somany',
                'gstin' => '19AAACS5678G1Z2'
            ]);

        $response->assertStatus(201);
        $id = $response->json('manufacturer.id');

        // 2. Update
        $updateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/manufacturers-crud/{$id}", [
                'legal_name' => 'Somany Ceramics Limited Updated',
                'verification_status' => 'VERIFIED'
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('manufacturer.verification_status', 'VERIFIED');

        // 3. Delete
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/manufacturers-crud/{$id}");

        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('manufacturers', ['id' => $id]);
    }

    public function test_org_admin_can_create_manufacturer_but_cannot_update_or_delete()
    {
        $tokenA = $this->userA->createToken('test')->plainTextToken;

        // 1. Create -> Allowed
        $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Jaquar & Company Pvt Ltd',
                'trade_name' => 'Jaquar',
                'gstin' => '06AAACJ9012H1Z9'
            ]);

        $response->assertStatus(201);
        $id = $response->json('manufacturer.id');

        // 2. Update -> Forbidden (403)
        $updateResponse = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->putJson("/api/manufacturers-crud/{$id}", [
                'legal_name' => 'Unauthorized Update Name'
            ]);

        $updateResponse->assertStatus(403)
            ->assertJsonPath('message', 'Only Super Admin can update shared global manufacturer records.');

        // 3. Delete -> Forbidden (403)
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->deleteJson("/api/manufacturers-crud/{$id}");

        $deleteResponse->assertStatus(403)
            ->assertJsonPath('message', 'Only Super Admin can delete shared global manufacturer records.');
    }

    public function test_duplicate_gstin_detection()
    {
        Manufacturer::create([
            'legal_name' => 'Kajaria Ceramics Limited',
            'gstin' => '27AAACK1234F1Z5'
        ]);

        $tokenA = $this->userA->createToken('test')->plainTextToken;

        // Try to create another manufacturer with the same GSTIN
        $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/manufacturers-crud', [
                'legal_name' => 'Kajaria Duplicate Entry',
                'gstin' => '27aaack1234f1z5' // Normalized case
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('duplicate_type', 'exact_gstin');
    }

    public function test_organizations_can_create_products_referencing_same_global_manufacturer()
    {
        $mfg = Manufacturer::create([
            'legal_name' => 'Shared Global Manufacturer Ltd',
            'trade_name' => 'SharedMfg',
            'gstin' => '33AAACS1111A1Z0'
        ]);

        // Setup Org A dependencies
        $catA = Category::create(['organization_id' => $this->orgA->id, 'name' => 'Tiles Org A', 'slug' => 'tiles-a']);
        $brandA = Brand::create(['organization_id' => $this->orgA->id, 'name' => 'Brand A', 'slug' => 'brand-a']);
        $taxA = TaxProfile::create(['organization_id' => $this->orgA->id, 'name' => 'GST 18% A', 'cgst_rate' => 9, 'sgst_rate' => 9]);
        $unit = Unit::create(['name' => 'Box', 'symbol' => 'box', 'unit_type' => 'QUANTITY', 'is_active' => true]);

        // Product Org A
        $productA = Product::create([
            'organization_id' => $this->orgA->id,
            'category_id' => $catA->id,
            'brand_id' => $brandA->id,
            'manufacturer_id' => $mfg->id,
            'purchase_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'sku' => 'SKU-ORGA-001',
            'name' => 'Product Org A',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $taxA->id
        ]);

        // Setup Org B dependencies
        $catB = Category::create(['organization_id' => $this->orgB->id, 'name' => 'Tiles Org B', 'slug' => 'tiles-b']);
        $brandB = Brand::create(['organization_id' => $this->orgB->id, 'name' => 'Brand B', 'slug' => 'brand-b']);
        $taxB = TaxProfile::create(['organization_id' => $this->orgB->id, 'name' => 'GST 18% B', 'cgst_rate' => 9, 'sgst_rate' => 9]);

        // Product Org B
        $productB = Product::create([
            'organization_id' => $this->orgB->id,
            'category_id' => $catB->id,
            'brand_id' => $brandB->id,
            'manufacturer_id' => $mfg->id,
            'purchase_unit_id' => $unit->id,
            'sales_unit_id' => $unit->id,
            'base_unit_id' => $unit->id,
            'sku' => 'SKU-ORGB-001',
            'name' => 'Product Org B',
            'inventory_behavior' => 'STANDARD',
            'tax_profile_id' => $taxB->id
        ]);

        // Assert products share the same manufacturer_id
        $this->assertEquals($productA->manufacturer_id, $productB->manufacturer_id);
        $this->assertEquals($mfg->id, $productA->manufacturer_id);

        // Assert organization IDs remain isolated
        $this->assertNotEquals($productA->organization_id, $productB->organization_id);

        // Assert Org A cannot access Org B product via tenant scoping when TenantContext is bound to Org A
        $context = app(\App\Shared\Context\TenantContext::class);
        $context->setUser($this->userA);
        $context->setOrganization($this->orgA);

        $this->assertNull(Product::find($productB->id));
        $this->assertNotNull(Product::find($productA->id));
    }
}
