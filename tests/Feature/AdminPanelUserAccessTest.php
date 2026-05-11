<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class AdminPanelUserAccessTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('Пользователь не может получить доступ к админ-панели')]
    public function test_regular_user_cannot_access_admin_panel(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        $response = $this->actingAs($user)->get('/admin/dashboard');

        $response->assertStatus(403);
    }
}
