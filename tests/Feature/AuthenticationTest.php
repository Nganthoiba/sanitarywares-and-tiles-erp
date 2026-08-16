<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'name' => 'Test Org',
            'code' => 'TEST01',
            'is_active' => true
        ]);

        $this->user = User::create([
            'organization_id' => $this->org->id,
            'name' => 'Test User',
            'email' => 'test@org.com',
            'password' => Hash::make('password123')
        ]);
    }

    public function test_user_can_login_with_valid_credentials()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'test@org.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'organization' => ['id', 'name'],
                    'branches',
                    'permissions'
                ]
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'test@org.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertStatus(401);
    }

    public function test_user_cannot_login_when_organization_inactive()
    {
        $this->org->is_active = false;
        $this->org->save();

        $response = $this->postJson('/api/login', [
            'email' => 'test@org.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_logout()
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->postJson('/api/logout', [], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200);
        $this->assertEmpty($this->user->tokens);
    }

    public function test_user_can_update_profile_info()
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@org.com'
        ], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.email', 'updated@org.com');

        $this->user->refresh();
        $this->assertEquals('Updated Name', $this->user->name);
        $this->assertEquals('updated@org.com', $this->user->email);
    }

    public function test_user_can_change_password()
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'test@org.com',
            'current_password' => 'password123',
            'new_password' => 'newpassword123'
        ], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200);

        $this->user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $this->user->password));
    }

    public function test_user_cannot_change_password_with_incorrect_current_password()
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'test@org.com',
            'current_password' => 'wrongpassword',
            'new_password' => 'newpassword123'
        ], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'The current password you entered is incorrect.');
    }

    public function test_user_cannot_change_password_with_mismatched_confirmation()
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'test@org.com',
            'current_password' => 'password123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'differentpassword'
        ], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(422);
    }
}
