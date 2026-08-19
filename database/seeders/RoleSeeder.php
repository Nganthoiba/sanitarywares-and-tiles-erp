<?php

namespace Database\Seeders;

use App\Domains\Security\Models\Role;
use App\Library\Database\AutoIncrement;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'id' => 1,
                'slug' => 'super-admin',
                'name' => 'Super Admin',
                'is_system' => true,
            ],
            [
                'id' => 2,
                'slug' => 'administrator',
                'name' => 'Organization Administrator',
                'is_system' => true,
            ]
        ];
        Role::upsert($roles, ['id'], ['name', 'slug', 'is_system']);

        AutoIncrement::resetIndex('roles', 'id');
    }
}
