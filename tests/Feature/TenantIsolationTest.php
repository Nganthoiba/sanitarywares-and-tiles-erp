<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_isolation_prevents_cross_tenant_data_access()
    {
        // 1. Create Organization A & User A
        $orgA = Organization::create(['name' => 'Org A', 'code' => 'ORGA', 'is_active' => true]);
        $userA = User::create([
            'organization_id' => $orgA->id,
            'name' => 'User A',
            'email' => 'user@orga.com',
            'password' => bcrypt('password')
        ]);

        // 2. Create Organization B & User B
        $orgB = Organization::create(['name' => 'Org B', 'code' => 'ORGB', 'is_active' => true]);
        $userB = User::create([
            'organization_id' => $orgB->id,
            'name' => 'User B',
            'email' => 'user@orgb.com',
            'password' => bcrypt('password')
        ]);

        // 3. Create categories inside each organization
        $catA = Category::create([
            'organization_id' => $orgA->id,
            'name' => 'Category in Org A',
            'slug' => 'cat-a'
        ]);

        $catB = Category::create([
            'organization_id' => $orgB->id,
            'name' => 'Category in Org B',
            'slug' => 'cat-b'
        ]);

        // 4. Authenticate as User A and query categories directly in DB
        $this->actingAs($userA, 'web');
        
        // Assert Org B category is NOT visible
        $categoriesSeenByUserA = Category::all();
        $this->assertTrue($categoriesSeenByUserA->contains($catA));
        $this->assertFalse($categoriesSeenByUserA->contains($catB));

        // 5. Authenticate as User B and query categories directly in DB
        $this->actingAs($userB, 'web');

        $categoriesSeenByUserB = Category::all();
        $this->assertTrue($categoriesSeenByUserB->contains($catB));
        $this->assertFalse($categoriesSeenByUserB->contains($catA));
    }
}
