<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Domains\Master\Models\Brand;
use App\Domains\Master\Models\Organization;
use App\Models\User;
use App\Shared\Context\TenantContext;

class GlobalBrandTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Organization $orgB;
    protected User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orgA = Organization::create(['code' => 'ORG-A', 'name' => 'Org Alpha Tiles']);
        $this->orgB = Organization::create(['code' => 'ORG-B', 'name' => 'Org Beta Sanitaryware']);

        $this->userA = User::factory()->create([
            'organization_id' => $this->orgA->id,
            'name' => 'Alpha Admin'
        ]);
    }

    public function test_brand_can_be_created_without_organization_id()
    {
        $brand = Brand::create([
            'name' => 'Global Kajaria',
            'slug' => 'global-kajaria',
            'description' => 'Global tile manufacturer brand',
            'is_active' => true
        ]);

        $this->assertDatabaseHas('brands', [
            'id' => $brand->id,
            'name' => 'Global Kajaria',
            'slug' => 'global-kajaria'
        ]);
    }

    public function test_brand_is_accessible_across_different_tenant_contexts()
    {
        Brand::create(['name' => 'Global Kohler', 'slug' => 'global-kohler']);

        // Set context to Org A
        app(TenantContext::class)->setOrganization($this->orgA);
        $countOrgA = Brand::count();

        // Set context to Org B
        app(TenantContext::class)->setOrganization($this->orgB);
        $countOrgB = Brand::count();

        // Clear context
        app(TenantContext::class)->setOrganization(null);
        $countContextless = Brand::count();

        $this->assertEquals(1, $countOrgA, 'Brand must be accessible under Org A context.');
        $this->assertEquals(1, $countOrgB, 'Brand must be accessible under Org B context.');
        $this->assertEquals(1, $countContextless, 'Brand must be accessible without tenant context.');
    }

    public function test_brand_api_store_and_update_as_global_master()
    {
        $this->actingAs($this->userA);

        $response = $this->postJson('/api/brands-crud', [
            'name' => 'Jaquar Premium',
            'slug' => 'jaquar-premium',
            'description' => 'Sanitary fittings brand'
        ]);

        $response->assertStatus(201);
        $brandId = $response->json('brand.id');

        $this->assertDatabaseHas('brands', [
            'id' => $brandId,
            'slug' => 'jaquar-premium'
        ]);

        $updateResponse = $this->putJson("/api/brands-crud/{$brandId}", [
            'name' => 'Jaquar Global Premium'
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('brands', [
            'id' => $brandId,
            'name' => 'Jaquar Global Premium'
        ]);
    }
}
