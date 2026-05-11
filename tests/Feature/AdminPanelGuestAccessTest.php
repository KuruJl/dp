<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class AdminPanelGuestAccessTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('Гость не может получить доступ к админ-панели')]
    public function test_guest_cannot_access_admin_panel(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/login');
    }
}
