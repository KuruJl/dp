<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Assembly;
use App\Models\Comment;
use App\Models\Component;
use App\Models\Category;
use App\Models\Manufacturer;


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Отключаем проверку внешних ключей
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 2. Очищаем таблицы. ВАЖНО: сначала таблицы-"дети", потом "родители".
        // Но с отключенной проверкой порядок не так важен.
        Comment::truncate();
        Assembly::truncate();
        DB::table('assembly_user_like')->truncate(); // Промежуточную таблицу чистим так
        DB::table('assembly_component')->truncate(); // И эту тоже
        User::truncate();
        
        // Очищаем таблицы компонентов
        Component::truncate();
        Category::truncate();
        Manufacturer::truncate();

        // 3. Включаем проверку обратно!
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 4. Теперь вызываем все сидеры для наполнения чистых таблиц
        $this->call([
            UserSeeder::class,
            ComponentSeeder::class,
            AssemblySeeder::class,

        ]);
    }
}