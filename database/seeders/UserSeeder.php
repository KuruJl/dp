<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Просто создаем пользователей
        User::create([
            'name' => 'Test User',
            'email' => 'q@gmail.com',
            'password' => Hash::make('1q2w3e4r'),
            'is_admin' => false,
        ]);

        User::create([
            'name' => 'Admin User',
            'email' => 'a@gmail.com',
            'password' => Hash::make('1q2w3e4r'),
            'is_admin' => true,
        ]);
    }
}