<?php

namespace App\Domains\Security\Services;

use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Models\User;
use App\Domains\Security\Models\Permission;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\UserScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OrganizationRegistrationService
{
    /**
     * Provision a complete new organization and owner account.
     */
    public function register(array $orgData, array $userData): array
    {
        return DB::transaction(function () use ($orgData, $userData) {
            // 1. Create Organization
            $org = Organization::create([
                'code' => $orgData['code'] ?? 'ORG-' . strtoupper(Str::random(6)),
                'name' => $orgData['name'],
                'legal_name' => $orgData['legal_name'] ?? $orgData['name'],
                'business_type' => $orgData['business_type'] ?? 'Proprietorship',
                'country' => $orgData['country'] ?? 'India',
                'state' => $orgData['state'] ?? 'Maharashtra',
                'city' => $orgData['city'] ?? 'Mumbai',
                'address' => $orgData['address'] ?? null,
                'email' => $orgData['email'] ?? null,
                'phone' => $orgData['phone'] ?? null,
                'website' => $orgData['website'] ?? null,
                'gstin' => $orgData['gstin'] ?? null,
                'pan' => $orgData['pan'] ?? null,
                'business_registration_number' => $orgData['business_registration_number'] ?? null,
                'subscription_plan' => $orgData['subscription_plan'] ?? 'FREE_TRIAL',
                'subscription_start' => now()->toDateString(),
                'subscription_expiry' => now()->addDays(30)->toDateString(),
                'is_active' => true,
                'settings' => [
                    'allow_negative_stock' => false,
                    'tax_inclusive_pricing' => false,
                ],
                'preferences' => [
                    'currency' => 'INR',
                    'timezone' => 'Asia/Kolkata',
                    'date_format' => 'Y-m-d',
                ]
            ]);

            // 2. Create Owner User
            $user = User::create([
                'organization_id' => $org->id,
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
            ]);

            // 3. Resolve Operational Permissions from Database
            $permissionIds = Permission::where('enabled', true)
                ->where('slug', 'not like', 'platform.%')
                ->pluck('id')
                ->toArray();

            // 4. Create Default Administrator Role for the organization & Assign Permissions
            $adminRole = Role::updateOrCreate(
                // ['organization_id' => $org->id, 'slug' => 'administrator'],
                ['slug' => 'administrator'],
                [
                    'name' => 'Organization Administrator',
                    'is_system' => true,
                ]
            );

            if (!empty($permissionIds)) {
                $adminRole->permissions()->sync($permissionIds);
            }

            // 5. Assign Administrator Role to the Owner User
            $user->roles()->attach($adminRole->id, ['organization_id' => $org->id]);
            $user->default_role_id = $adminRole->id;
            $user->save();

            // 6. Create Default Branch
            $branch = Branch::create([
                'organization_id' => $org->id,
                'name' => $org->name . ' Main Branch',
                'code' => 'HQ-' . $org->code . '-01',
                'email' => $org->email,
                'phone' => $org->phone,
                'address' => $org->address
            ]);

            // 7. Create Default Warehouse
            $warehouse = Warehouse::create([
                'organization_id' => $org->id,
                'branch_id' => $branch->id,
                'name' => 'Central Warehouse',
                'code' => 'WH-' . $org->code . '-01',
                'type' => 'MAIN',
                'is_active' => true,
                'address' => $branch->address
            ]);

            // 8. Create Default UserScope for the Owner
            UserScope::create([
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id
            ]);

            $user_permissions = Permission::whereIn('id', $permissionIds)->pluck('slug')->toArray();

            return [
                'organization' => $org,
                'user' => $user,
                'branch' => $branch,
                'warehouse' => $warehouse,
                'user_permissions' => $user_permissions,
            ];
        });
    }
}
