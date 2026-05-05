<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product; // Теперь используем Product
use App\Models\Assembly;
use Faker\Factory as Faker;

class AssemblySeeder extends Seeder
{
    private const ASSEMBLIES_TO_CREATE = 20;

    public function run(): void
    {
        $faker = Faker::create('ru_RU');

        // Создадим одного пользователя для тестов, если таблица пустая
        if (User::count() === 0) {
            User::factory()->create([
                'name' => 'Тестовый Пользователь',
                'email' => 'test@test.com',
                'password' => bcrypt('password'),
            ]);
        }

        $users = User::all();
        $componentsBySlug = Product::with('category')->get()->groupBy('category.slug');

        if ($componentsBySlug->isEmpty()) {
            $this->command->warn('Нет компонентов! Сначала запусти импорт (php artisan import:dns).');
            return;
        }

        $this->command->info('Создание тестовых сборок...');

        $requiredSlugs =[
            'processory', 'materinskie-platy', 'operativnaia-pamiat',
            'videokarty', 'bloki-pitaniia', 'm2-ssd-nakopiteli',
        ];

        for ($i = 0; $i < self::ASSEMBLIES_TO_CREATE; $i++) {
            $randomUser = $users->random();

            $assembly = Assembly::create([
                'user_id' => $randomUser->id,
                'name' => 'Сборка ' . $faker->catchPhrase(),
                'description' => $faker->realText(200),
            ]);

            $componentIds =[];
            foreach ($requiredSlugs as $slug) {
                if (isset($componentsBySlug[$slug])) {
                    $componentIds[] = $componentsBySlug[$slug]->random()->id;
                }
            }

            if (isset($componentsBySlug['kulery-dlia-processora'])) {
                 $componentIds[] = $componentsBySlug['kulery-dlia-processora']->random()->id;
            }
            if (isset($componentsBySlug['monitory'])) {
                 $componentIds[] = $componentsBySlug['monitory']->random()->id;
            }

            if (!empty($componentIds)) {
                // Связываем товары со сборкой
                $assembly->products()->attach($componentIds);
            }
        }
        
        $this->command->info(self::ASSEMBLIES_TO_CREATE . ' тестовых сборок успешно создано.');
    }
}