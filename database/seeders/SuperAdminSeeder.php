<?php

namespace Database\Seeders;

use App\Models\User;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure super-admin role exists with organization_id = null
        $superAdminRole = Role::updateOrCreate(
            ['slug' => 'super-admin'],
            [
                'organization_id' => null,
                'name' => 'Super Administrator',
                'is_system' => true,
            ]
        );

        // Assign all enabled permissions to Super Admin role
        $allPermissions = Permission::where('enabled', true)->pluck('id');
        $superAdminRole->permissions()->syncWithPivotValues($allPermissions, ['organization_id' => null]);

        // Ensure Super Admin user exists with organization_id = null
        $user = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'smartnotification1@gmail.com'],
            [
                'organization_id' => null,
                'default_role_id' => $superAdminRole->id,
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
            ]
        );

        // Assign role in user_roles pivot with organization_id = null
        $user->roles()->syncWithoutDetaching([
            $superAdminRole->id => ['organization_id' => null]
        ]);
    }
}
