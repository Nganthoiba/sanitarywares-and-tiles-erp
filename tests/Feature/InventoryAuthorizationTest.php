<?php

namespace Tests\Feature;

use App\Domains\Master\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_user_with_null_organization_id_is_forbidden_from_accessing_inventory(): void
    {
        // Platform user (organization_id === null)
        $platformUser = User::factory()->create([
            'organization_id' => null,
            'name' => 'Platform Super Admin',
            'email' => 'platform@admin.com',
        ]);

        $response = $this->actingAs($platformUser, 'sanctum')
            ->getJson('/api/inventory');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Platform users without an organization are not authorized to access inventory.'
            ]);
    }

    public function test_platform_user_is_forbidden_from_granite_slabs(): void
    {
        $platformUser = User::factory()->create([
            'organization_id' => null,
            'email' => 'platform2@admin.com',
        ]);

        $response = $this->actingAs($platformUser, 'sanctum')
            ->getJson('/api/granite/slabs');

        $response->assertStatus(403);
    }

    public function test_platform_user_is_forbidden_from_inventory_form_data(): void
    {
        $platformUser = User::factory()->create([
            'organization_id' => null,
            'email' => 'platform3@admin.com',
        ]);

        $response = $this->actingAs($platformUser, 'sanctum')
            ->getJson('/api/inventory/form-data');

        $response->assertStatus(403);
    }

    public function test_platform_user_is_forbidden_from_inventory_reports(): void
    {
        $platformUser = User::factory()->create([
            'organization_id' => null,
            'email' => 'platform4@admin.com',
        ]);

        $response = $this->actingAs($platformUser, 'sanctum')
            ->getJson('/api/reports/inventory');

        $response->assertStatus(403);
    }

    public function test_tenant_user_with_non_null_organization_id_can_access_inventory(): void
    {
        $organization = Organization::create([
            'name' => 'Acme Sanitary Wares',
            'code' => 'ACME-001',
        ]);

        $tenantUser = User::factory()->create([
            'organization_id' => $organization->id,
            'email' => 'tenant@acme.com',
        ]);

        $response = $this->actingAs($tenantUser, 'sanctum')
            ->getJson('/api/inventory');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'summary_cards',
                'data',
            ]);
    }
}
