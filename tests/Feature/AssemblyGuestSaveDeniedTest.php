<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class AssemblyGuestSaveDeniedTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('Неавторизованный пользователь не может сохранить сборку')]
    public function test_guest_cannot_save_assembly(): void
    {
        $response = $this->postJson('/api/assemblies', [
            'name' => 'Сборка от гостя',
            'component_ids' => [],
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('assemblies', [
            'name' => 'Сборка от гостя',
        ]);
    }
}
