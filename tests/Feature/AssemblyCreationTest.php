<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Manufacturer;
use Illuminate\Support\Str;

class AssemblyCreationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Тест: Авторизованный пользователь может создать новую сборку.
     */
    public function test_authenticated_user_can_create_assembly(): void
    {
        // 1. Подготовка (Arrange)
        // Создаем пользователя, от имени которого будем действовать
        $user = User::factory()->create();

        // Создаем необходимые "запчасти" для нашей тестовой сборки
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
        
        // Готовим данные, которые мы "отправим" на API
        $assemblyData = [
            'name' => 'Моя тестовая сборка',
            'component_ids' => [
                $component1->id,
                $component2->id,
            ],
        ];

        // 2. Действие (Act)
        // Логинимся под пользователем и отправляем POST-запрос на API
        $response = $this->actingAs($user)->postJson('/api/assemblies', $assemblyData);

        // 3. Проверки (Assert)
        // Проверяем, что сервер ответил статусом 201 (Created)
        $response->assertStatus(201);

        // Проверяем, что в JSON-ответе есть имя нашей сборки
        $response->assertJsonFragment(['name' => 'Моя тестовая сборка']);
        
        // Самая важная проверка: убеждаемся, что запись о сборке появилась В БАЗЕ ДАННЫХ
        $this->assertDatabaseHas('assemblies', [
            'name' => 'Моя тестовая сборка',
            'user_id' => $user->id,
        ]);

        // Дополнительная проверка: убеждаемся, что компоненты привязались к сборке
        $this->assertDatabaseHas('assembly_product', [
            'product_id' => $component1->id,
        ]);
        $this->assertDatabaseHas('assembly_product', [
            'product_id' => $component2->id,
        ]);
    }

    /**
     * Тест: Гость не может создать сборку.
     */
    public function test_guest_cannot_create_assembly(): void
    {
        $assemblyData = [
            'name' => 'Сборка от гостя',
            'component_ids' => [],
        ];

        // Отправляем запрос без авторизации
        $response = $this->postJson('/api/assemblies', $assemblyData);
        
        // Ожидаем статус 401 (Unauthorized)
        $response->assertStatus(401);
    }
}