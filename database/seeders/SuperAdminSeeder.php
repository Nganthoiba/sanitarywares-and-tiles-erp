<?php

namespace Database\Seeders;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Security\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        $orgId = $org?->id;

        // Ensure super-admin role exists
        $superAdminRole = Role::firstOrCreate(
            ['slug' => 'super-admin'],
            [
                'organization_id' => $orgId,
                'name' => 'Super Administrator',
                'is_system' => true,
            ]
        );

        // Ensure Super Admin user exists
        $user = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'smartnotification1@gmail.com'],
            [
                'organization_id' => $orgId,
                'default_role_id' => $superAdminRole->id,
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
            ]
        );

        // Assign role in user_roles pivot
        $user->roles()->syncWithoutDetaching([
            $superAdminRole->id => ['organization_id' => $orgId]
        ]);
    }
}
