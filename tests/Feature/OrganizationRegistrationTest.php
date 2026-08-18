<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\UserScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_self_service_registration_provisions_all_default_resources()
    {
        $payload = [
            'organization' => [
                'name' => 'Apex Sanitarywares Ltd',
                'legal_name' => 'Apex Sanitarywares Limited',
                'business_type' => 'Pvt Ltd',
                'country' => 'India',
                'state' => 'Karnataka',
                'city' => 'Bengaluru',
                'address' => '502, Outer Ring Road, Bengaluru',
                'email' => 'contact@apex.com',
                'phone' => '08099887766',
                'website' => 'https://apex.com',
                'gstin' => '29AAACA1234A1Z1',
                'pan' => 'AAACA1234A',
                'business_registration_number' => 'U12345KA2026PTC123456',
            ],
            'owner' => [
                'name' => 'Jayesh Kumar',
                'email' => 'jayesh@apex.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]
        ];

        $response = $this->postJson('/api/register-organization', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'access_token',
                'token_type',
                'organization',
                'user'
            ]);

        // Assert organization and owner exist
        $org = Organization::where('code', $response->json('organization.code'))->first();
        $this->assertNotNull($org);
        $this->assertEquals('Apex Sanitarywares Ltd', $org->name);
        $this->assertEquals('Karnataka', $org->state);

        $user = User::withoutGlobalScopes()->where('email', 'jayesh@apex.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals($org->id, $user->organization_id);

        // Assert Administrator Role was created and assigned
        $role = Role::withoutGlobalScopes()->where('organization_id', $org->id)->where('slug', 'administrator')->first();
        $this->assertNotNull($role);
        $this->assertTrue($role->is_system);
        $this->assertTrue($user->roles()->withoutGlobalScopes()->get()->contains('id', $role->id));

        // Assert Default Branch was created
        $branch = Branch::withoutGlobalScopes()->where('organization_id', $org->id)->first();
        $this->assertNotNull($branch);
        $this->assertEquals('Apex Sanitarywares Ltd Main Branch', $branch->name);

        // Assert Default Warehouse was created
        $warehouse = Warehouse::withoutGlobalScopes()->where('organization_id', $org->id)->first();
        $this->assertNotNull($warehouse);
        $this->assertEquals('Central Warehouse', $warehouse->name);
        $this->assertEquals($branch->id, $warehouse->branch_id);

        // Assert Default UserScope is created
        $scope = UserScope::withoutGlobalScopes()->where('organization_id', $org->id)->where('user_id', $user->id)->first();
        $this->assertNotNull($scope);
        $this->assertEquals($branch->id, $scope->branch_id);
        $this->assertEquals($warehouse->id, $scope->warehouse_id);

        // Assert newly registered user token can authenticate to protected endpoints
        $token = $response->json('access_token');
        $grnResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/grn');

        $grnResponse->assertStatus(200);

        $userResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/user');

        $userResponse->assertStatus(200)
            ->assertJsonPath('email', 'jayesh@apex.com');
    }
}
