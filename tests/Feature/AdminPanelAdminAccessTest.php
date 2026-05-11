<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class AdminPanelAdminAccessTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('Администратор может получить доступ к админ-панели')]
    public function test_admin_can_access_admin_panel(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertOk();
    }
}
