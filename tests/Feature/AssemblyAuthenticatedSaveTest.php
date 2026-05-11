<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class AssemblyAuthenticatedSaveTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('Авторизованный пользователь может создать сборку')]
    public function test_authenticated_user_can_save_assembly(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $manufacturer = Manufacturer::factory()->create();

        $component1 = Product::create([
            'name' => 'Test CPU',
            'slug' => Str::slug('Test CPU').'-1',
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'price' => 10000,
            'quantity' => 5,
            'status' => 'активен',
        ]);

        $component2 = Product::create([
            'name' => 'Test Motherboard',
            'slug' => Str::slug('Test Motherboard').'-1',
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'price' => 12000,
            'quantity' => 5,
            'status' => 'активен',
        ]);

        $response = $this->actingAs($user)->postJson('/api/assemblies', [
            'name' => 'Моя тестовая сборка',
            'component_ids' => [$component1->id, $component2->id],
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Моя тестовая сборка']);

        $this->assertDatabaseHas('assemblies', [
            'name' => 'Моя тестовая сборка',
            'user_id' => $user->id,
        ]);
    }
}
