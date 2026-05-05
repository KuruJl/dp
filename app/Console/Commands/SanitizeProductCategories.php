<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;

class SanitizeProductCategories extends Command
{
    protected $signature = 'products:sanitize-categories {--dry-run : Только показать изменения, без записи в БД}';

    protected $description = 'Исправляет категории товаров по данным имени и характеристики "Тип"';

    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');
        $fixed = 0;
        $checked = 0;

        $this->info($isDryRun ? 'Режим dry-run: изменения НЕ будут сохранены.' : 'Запуск санитайзера категорий...');

        Product::with(['category', 'attributes'])->chunkById(200, function ($products) use (&$fixed, &$checked, $isDryRun) {
            foreach ($products as $product) {
                $checked++;
                $target = $this->detectCategoryData($product);
                if (!$target) {
                    continue;
                }

                $currentSlug = $product->category?->slug;
                if ($currentSlug === $target['slug']) {
                    continue;
                }

                $category = Category::firstOrCreate(
                    ['slug' => $target['slug']],
                    ['name' => $target['name']]
                );

                if (!$isDryRun) {
                    $product->category_id = $category->id;
                    $product->save();
                }

                $fixed++;
                $this->line("{$product->id}: {$currentSlug} -> {$target['slug']} | {$product->name}");
            }
        });

        $this->newLine();
        $this->info("Проверено товаров: {$checked}");
        $this->info("Исправлено категорий: {$fixed}");

        return self::SUCCESS;
    }

    private function detectCategoryData(Product $product): ?array
    {
        $nameLower = mb_strtolower((string) $product->name);
        $typeAttr = $product->attributes->firstWhere('name', 'Тип');
        $typeLower = mb_strtolower((string) ($typeAttr?->pivot?->value ?? ''));
        $searchString = trim($nameLower . ' ' . $typeLower);

        if ($searchString === '') {
            return null;
        }

        if (str_contains($searchString, 'коврик')) {
            return ['name' => 'Коврики для мыши', 'slug' => 'kovriki-dlia-mysi'];
        }
        if (str_contains($searchString, 'материнская плата')) {
            return ['name' => 'Материнские платы', 'slug' => 'materinskie-platy'];
        }
        if (str_contains($searchString, 'кулер') || str_contains($searchString, 'система охлаждения')) {
            return ['name' => 'Кулеры', 'slug' => 'kulery-dlia-processora'];
        }
        if (str_contains($searchString, 'процессор') || str_contains($searchString, 'cpu')) {
            return ['name' => 'Процессоры', 'slug' => 'processory'];
        }
        if (str_contains($searchString, 'видеокарта') || str_contains($searchString, 'gpu')) {
            return ['name' => 'Видеокарты', 'slug' => 'videokarty'];
        }
        if (str_contains($searchString, 'блок питания') || str_contains($searchString, 'psu')) {
            return ['name' => 'Блоки питания', 'slug' => 'bloki-pitaniia'];
        }
        if (str_contains($searchString, 'оперативная память') || str_contains($searchString, 'dimm')) {
            return ['name' => 'Оперативная память', 'slug' => 'operativnaia-pamiat'];
        }
        if (str_contains($searchString, 'm.2') || str_contains($searchString, 'm2')) {
            return ['name' => 'M.2 SSD', 'slug' => 'm2-ssd-nakopiteli'];
        }
        if (str_contains($searchString, 'ssd') || str_contains($searchString, 'msata') || str_contains($searchString, 'твердотельный')) {
            return ['name' => 'SATA SSD', 'slug' => 'sata-ssd-nakopiteli'];
        }
        if (str_contains($searchString, 'жесткий диск') || str_contains($searchString, 'hdd')) {
            return ['name' => 'Жесткий диск', 'slug' => 'zestkii-disk'];
        }
        if (str_contains($searchString, 'монитор')) {
            return ['name' => 'Мониторы', 'slug' => 'monitory'];
        }
        if (str_contains($searchString, 'наушники') || str_contains($searchString, 'гарнитура')) {
            return ['name' => 'Наушники', 'slug' => 'nausniki-dlia-pk'];
        }
        if (str_contains($searchString, 'клавиатура') || str_contains($searchString, 'кепад') || str_contains($searchString, 'keypad')) {
            return ['name' => 'Клавиатуры', 'slug' => 'klaviatury'];
        }
        if (str_contains($searchString, 'мышь') || str_contains($searchString, 'мышка') || str_contains($searchString, 'трекпад') || str_contains($searchString, 'trackpad')) {
            return ['name' => 'Мыши', 'slug' => 'mysi'];
        }
        if (str_contains($searchString, 'корпус')) {
            return ['name' => 'Корпуса', 'slug' => 'korpusa'];
        }

        return null;
    }
}
