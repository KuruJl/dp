<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class AdminPanelAccessTest extends TestCase
{
    use RefreshDatabase; // Этот трейт автоматически сбрасывает базу данных после каждого теста

    /**
     * Тест: Гость (неавторизованный пользователь) не может получить доступ к админке.
     * Он должен быть перенаправлен на страницу логина.
     */
    public function test_guest_cannot_access_admin_panel(): void
    {
        // 1. Действие: Отправляем GET-запрос на дашборд админки
        $response = $this->get('/admin/dashboard');

        // 2. Проверка: Ожидаем, что нас перенаправит (статус 302) на страницу /login
        $response->assertRedirect('/login');
    }

    /**
     * Тест: Обычный пользователь (не админ) не может получить доступ к админке.
     * Он должен получить ошибку 403 (Доступ запрещен).
     */
    public function test_regular_user_cannot_access_admin_panel(): void
    {
        // 1. Подготовка: Создаем обычного пользователя
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        // 2. Действие: Логинимся под этим пользователем и отправляем GET-запрос
        $response = $this->actingAs($user)->get('/admin/dashboard');

        // 3. Проверка: Ожидаем статус 403 (Forbidden)
        $response->assertStatus(403);
    }

    /**
     * Тест: Администратор МОЖЕТ получить доступ к админке.
     * Он должен получить статус 200 (OK).
     */
    public function test_admin_can_access_admin_panel(): void
    {
        // 1. Подготовка: Создаем пользователя-администратора
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        // 2. Действие: Логинимся под админом и отправляем GET-запрос
        $response = $this->actingAs($admin)->get('/admin/dashboard');

        // 3. Проверка: Ожидаем статус 200 (OK), что означает успешный доступ
        $response->assertOk(); // assertOk() - это то же самое, что assertStatus(200)
    }
}