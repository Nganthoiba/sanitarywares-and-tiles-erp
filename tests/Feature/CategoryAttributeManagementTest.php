<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\ProductAttribute;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CategoryAttributeManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $org;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->user = User::where('email', 'admin@example.com')->first();
        if (!$this->user) {
            $this->user = User::first();
        }
        $this->org = Organization::first();
    }

    /** @test */
    public function super_admin_can_fetch_category_attribute_management_details()
    {
        $tilesCategory = Category::where('slug', 'tiles')->first();
        $this->assertNotNull($tilesCategory);

        $response = $this->actingAs($this->user)->getJson("/api/categories/{$tilesCategory->id}/category-attributes");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'category' => ['id', 'name', 'slug'],
            'direct_attributes',
            'inherited_from',
            'inherited_attributes',
            'available_attributes'
        ]);
    }

    /** @test */
    public function super_admin_can_sync_category_product_attributes()
    {
        $sanitarywareCategory = Category::where('slug', 'sanitaryware')->first();
        $this->assertNotNull($sanitarywareCategory);

        $attr1 = ProductAttribute::where('slug', 'colour')->first();
        $attr2 = ProductAttribute::where('slug', 'material')->first() ?? ProductAttribute::first();

        $payload = [
            'attributes' => [
                [
                    'attribute_id' => $attr1->id,
                    'is_required' => true,
                    'sort_order' => 1,
                    'allowed_values' => ['White', 'Ivory', 'Black']
                ],
                [
                    'attribute_id' => $attr2->id,
                    'is_required' => false,
                    'sort_order' => 2,
                    'allowed_values' => null
                ]
            ]
        ];

        $response = $this->actingAs($this->user)->postJson("/api/categories/{$sanitarywareCategory->id}/category-attributes", $payload);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Category product specification attributes updated successfully.']);

        $this->assertDatabaseHas('category_product_attributes', [
            'category_id' => $sanitarywareCategory->id,
            'product_attribute_id' => $attr1->id,
            'is_required' => 1,
            'sort_order' => 1
        ]);

        // Verify that getSpecifications reflects the dynamically configured attributes
        $specsResponse = $this->actingAs($this->user)->getJson("/api/categories/{$sanitarywareCategory->id}/specifications");
        $specsResponse->assertStatus(200);
        $slugs = collect($specsResponse->json('specifications'))->pluck('slug')->toArray();
        $this->assertContains($attr1->slug, $slugs);
    }
}
