<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_generates_token_for_existing_user()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => Hash::make('oldpassword123'),
        ]);

        \Illuminate\Support\Facades\Mail::fake();

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'user@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'email']);

        $tokenRecord = DB::table('password_reset_tokens')->where('email', 'user@example.com')->first();
        $this->assertNotNull($tokenRecord);

        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\PasswordResetMail::class, function ($mail) {
            return $mail->hasTo('user@example.com');
        });
    }

    public function test_reset_password_successfully_updates_password()
    {
        $user = User::factory()->create([
            'email' => 'user2@example.com',
            'password' => Hash::make('oldpassword123'),
        ]);

        // Insert password reset token directly into database
        $plainToken = '654321';
        DB::table('password_reset_tokens')->insert([
            'email' => 'user2@example.com',
            'token' => Hash::make($plainToken),
            'created_at' => now(),
        ]);

        $resetResponse = $this->postJson('/api/reset-password', [
            'email' => 'user2@example.com',
            'token' => $plainToken,
            'password' => 'newsecurepassword123',
            'password_confirmation' => 'newsecurepassword123',
        ]);

        $resetResponse->assertStatus(200);
        $resetResponse->assertJson(['message' => 'Password has been reset successfully. You can now log in with your new password.']);

        $freshUser = User::withoutGlobalScopes()->where('email', 'user2@example.com')->first();
        $this->assertTrue(Hash::check('newsecurepassword123', $freshUser->password));

        // Attempt login with new password
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'user2@example.com',
            'password' => 'newsecurepassword123',
        ]);

        $loginResponse->assertStatus(200);
        $loginResponse->assertJsonStructure(['access_token']);
    }

    public function test_reset_password_fails_with_invalid_token()
    {
        User::factory()->create([
            'email' => 'user3@example.com',
        ]);

        $this->postJson('/api/forgot-password', [
            'email' => 'user3@example.com',
        ]);

        $resetResponse = $this->postJson('/api/reset-password', [
            'email' => 'user3@example.com',
            'token' => 'invalidcode',
            'password' => 'newsecurepassword123',
            'password_confirmation' => 'newsecurepassword123',
        ]);

        $resetResponse->assertStatus(422);
    }

    public function test_forgot_password_returns_404_for_unregistered_email()
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'message' => 'The entered email address is not registered in this application.'
        ]);
    }
}
