<?php

namespace Tests\Feature;

use App\Models\Attribute;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DiplomaScenariosTest extends TestCase
{
    use RefreshDatabase;

    private function logInfo(string $text): void
    {
        fwrite(STDOUT, "[INFO] {$text}\n");
    }

    private function logSuccess(string $text): void
    {
        fwrite(STDOUT, "[SUCCESS] {$text}\n");
    }

    private function createActiveProduct(array $overrides = []): Product
    {
        $category = Category::factory()->create();
        $manufacturer = Manufacturer::factory()->create();

        return Product::create(array_merge([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'name' => 'Тестовый товар',
            'slug' => 'test-product-' . Str::lower(Str::random(6)),
            'description' => 'Описание тестового товара',
            'price' => 1000,
            'quantity' => 10,
            'status' => 'активен',
        ], $overrides));
    }

    private function createProductWithSocket(Category $category, Manufacturer $manufacturer, string $name, string $socket): Product
    {
        $product = Product::create([
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::random(6),
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'price' => 15000,
            'quantity' => 10,
            'status' => 'активен',
        ]);

        $socketAttribute = Attribute::firstOrCreate(
            ['name' => 'Сокет'],
            ['type' => 'string']
        );

        $product->attributes()->attach($socketAttribute->id, ['value' => $socket]);

        return $product;
    }

    /** 3 позитивных функциональных сценария */
    public function test_positive_admin_can_access_dashboard(): void
    {
        $this->logInfo('Позитивный сценарий #1: вход администратора в админ-панель');
        /** @var User $admin */
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');
        $response->assertOk();

        $this->logSuccess('Администратор успешно получил доступ к /admin/dashboard');
    }

    public function test_positive_authenticated_user_can_create_assembly(): void
    {
        $this->logInfo('Позитивный сценарий #2: создание сборки авторизованным пользователем');
        /** @var User $user */
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $manufacturer = Manufacturer::factory()->create();

        $component1 = Product::create([
            'name' => 'Test CPU',
            'slug' => Str::slug('Test CPU') . '-1',
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'price' => 10000,
            'quantity' => 5,
            'status' => 'активен',
        ]);

        $component2 = Product::create([
            'name' => 'Test Motherboard',
            'slug' => Str::slug('Test Motherboard') . '-1',
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'price' => 12000,
            'quantity' => 5,
            'status' => 'активен',
        ]);

        $payload = [
            'name' => 'Моя тестовая сборка',
            'component_ids' => [$component1->id, $component2->id],
        ];

        $response = $this->actingAs($user)->postJson('/api/assemblies', $payload);
        $response->assertStatus(201)->assertJsonFragment(['name' => 'Моя тестовая сборка']);
        $this->assertDatabaseHas('assemblies', ['name' => 'Моя тестовая сборка', 'user_id' => $user->id]);

        $this->logSuccess('Сборка успешно создана и сохранена в БД');
    }

    public function test_positive_compatible_components_pass_compatibility_check(): void
    {
        $this->logInfo('Позитивный сценарий #3: проверка совместимых комплектующих');
        $cpuCategory = Category::factory()->create(['slug' => 'processory']);
        $mbCategory = Category::factory()->create(['slug' => 'materinskie-platy']);
        $manufacturer = Manufacturer::factory()->create();

        $cpu = $this->createProductWithSocket($cpuCategory, $manufacturer, 'CPU LGA 1700', 'LGA 1700');
        $motherboard = $this->createProductWithSocket($mbCategory, $manufacturer, 'MB LGA 1700', 'LGA 1700');

        $response = $this->postJson('/api/assemblies/check-compatibility', [
            'component_ids' => [$cpu->id, $motherboard->id],
        ]);

        $response->assertOk()->assertJson(['compatible' => true]);
        $this->logSuccess('Сервис совместимости вернул compatible=true');
    }

    /** 1 негативный функциональный сценарий на валидацию */
    public function test_negative_validation_review_form_rejects_invalid_data(): void
    {
        $this->logInfo('Негативный сценарий (валидация): отправка некорректного отзыва');
        /** @var User $user */
        $user = User::factory()->create();
        $product = $this->createActiveProduct();

        $response = $this->actingAs($user)->post("/products/{$product->id}/reviews", [
            'rating' => 0,      // должно быть 1..5
            'body' => 'bad',    // слишком короткий текст
        ]);

        $response->assertSessionHasErrors(['rating', 'body']);
        $this->logSuccess('Валидация сработала: сервер вернул ошибки по rating/body');
    }

    /** 2 негативных функциональных сценария на роли */
    public function test_negative_roles_guest_cannot_access_admin_dashboard(): void
    {
        $this->logInfo('Негативный сценарий ролей #1: гость пытается открыть админку');
        $response = $this->get('/admin/dashboard');
        $response->assertRedirect('/login');
        $this->logSuccess('Гость перенаправлен на /login');
    }

    public function test_negative_roles_regular_user_gets_403_on_admin_dashboard(): void
    {
        $this->logInfo('Негативный сценарий ролей #2: обычный пользователь пытается открыть админку');
        /** @var User $user */
        $user = User::factory()->create(['is_admin' => false]);
        $response = $this->actingAs($user)->get('/admin/dashboard');
        $response->assertStatus(403);
        $this->logSuccess('Обычный пользователь получил 403 (доступ запрещен)');
    }

    /** 1 сценарий тестирования веб-интерфейса */
    public function test_web_interface_catalog_page_displays_created_product(): void
    {
        $this->logInfo('Шаг 1: Создан товар и выполняется переход на страницу каталога');
        $category = Category::factory()->create(['name' => 'Мониторы', 'slug' => 'monitory']);
        $manufacturer = Manufacturer::factory()->create();
        $product = Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'name' => 'Монитор Test Vision 27',
            'slug' => 'monitor-test-vision-27',
            'price' => 19999,
            'quantity' => 4,
            'status' => 'активен',
        ]);

        $response = $this->get('/catalog/search?category=monitory');
        $response->assertOk();
        $this->logSuccess('Страница каталога открылась без ошибок');

        $this->logInfo('Шаг 2: Проверяем отображение созданной карточки товара');
        // Для Inertia SSR в тестовом ответе проверяем данные карточки в payload страницы.
        $response->assertSee('monitor-test-vision-27');
        $response->assertSee('category=monitory');
        $this->logSuccess('Данные карточки отображаются корректно в веб-интерфейсе');
    }
}

