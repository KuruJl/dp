<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Attribute;
use App\Models\ProductImage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class ImportDnsProducts extends Command
{
    // Теперь передаем не конкретный файл, а папку (по умолчанию папка 'imports')
    protected $signature = 'import:dns {path=imports}';

    protected $description = 'Массовый импорт всех JSON файлов с комплектующими из указанной папки';

    public function handle()
    {
        $path = $this->argument('path');
        $fullPath = base_path($path);

        // Проверяем, существует ли папка
        if (!File::exists($fullPath)) {
            $this->error("Папка {$path} не найдена! Создай папку в корне проекта и положи туда JSON файлы.");
            return;
        }

        // Собираем все .json файлы из папки
        $files =[];
        if (File::isDirectory($fullPath)) {
            $allFiles = File::files($fullPath);
            foreach ($allFiles as $file) {
                if ($file->getExtension() === 'json') {
                    $files[] = $file;
                }
            }
        } elseif (File::isFile($fullPath) && File::extension($fullPath) === 'json') {
            $files[] = new \SplFileInfo($fullPath);
        }

        if (empty($files)) {
            $this->error("В {$path} не найдено JSON файлов!");
            return;
        }

        $this->info("Найдено файлов для импорта: " . count($files));
        $this->newLine();

        // Запускаем цикл по всем найденным файлам
        foreach ($files as $file) {
            $this->info("Обработка файла: " . $file->getFilename());
            
            $json = File::get($file->getPathname());
            $productsData = json_decode($json, true);

            if (!$productsData) {
                $this->error("Ошибка чтения JSON в файле {$file->getFilename()}. Пропускаем его.");
                continue; // Идем к следующему файлу
            }

            // Прогресс-бар для текущего файла
            $this->withProgressBar($productsData, function ($item) {
                
                // --- СУПЕР-УМНЫЙ ДЕТЕКТОР КАТЕГОРИЙ ---
                $nameLower = mb_strtolower($item['name']);
                $typeLower = mb_strtolower($item['specifications']['Тип'] ?? '');
                
                // Объединяем имя и тип, чтобы искать сразу везде
                $searchString = $nameLower . ' ' . $typeLower;

                // Важно: сначала проверяем коврики, чтобы слово "мыши" в них не сработало дальше
                if (str_contains($searchString, 'коврик')) {
                    $catData =['name' => 'Коврики для мыши', 'slug' => 'kovriki-dlia-mysi'];
                } elseif (str_contains($searchString, 'материнская плата')) {
                    $catData =['name' => 'Материнские платы', 'slug' => 'materinskie-platy'];
                } elseif (str_contains($searchString, 'кулер') || str_contains($searchString, 'система охлаждения')) {
                    $catData =['name' => 'Кулеры', 'slug' => 'kulery-dlia-processora'];
                } elseif (str_contains($searchString, 'процессор')) {
                    $catData =['name' => 'Процессоры', 'slug' => 'processory'];
                } elseif (str_contains($searchString, 'видеокарта')) {
                    $catData =['name' => 'Видеокарты', 'slug' => 'videokarty'];
                } elseif (str_contains($searchString, 'блок питания')) {
                    $catData =['name' => 'Блоки питания', 'slug' => 'bloki-pitaniia'];
                } elseif (str_contains($searchString, 'оперативная память') || str_contains($searchString, 'dimm')) {
                    $catData =['name' => 'Оперативная память', 'slug' => 'operativnaia-pamiat'];
                } elseif (str_contains($searchString, 'm.2') || str_contains($searchString, 'm2')) {
                    $catData =['name' => 'M.2 SSD', 'slug' => 'm2-ssd-nakopiteli'];
                } elseif (str_contains($searchString, 'ssd') || str_contains($searchString, 'msata') || str_contains($searchString, 'твердотельный')) {
                    $catData =['name' => 'SATA SSD', 'slug' => 'sata-ssd-nakopiteli']; // Сюда же улетят и mSATA
                } elseif (str_contains($searchString, 'жесткий диск') || str_contains($searchString, 'hdd')) {
                    $catData = ['name' => 'Жесткий диск', 'slug' => 'zestkii-disk'];
                } elseif (str_contains($searchString, 'монитор')) {
                    $catData =['name' => 'Мониторы', 'slug' => 'monitory'];
                } elseif (str_contains($searchString, 'наушники') || str_contains($searchString, 'гарнитура')) {
                    $catData =['name' => 'Наушники', 'slug' => 'nausniki-dlia-pk']; // Поглотит все проводные/беспроводные
                } elseif (str_contains($searchString, 'клавиатура') || str_contains($searchString, 'кепад') || str_contains($searchString, 'keypad')) {
                    $catData =['name' => 'Клавиатуры', 'slug' => 'klaviatury']; // Поглотит кейпады
                } elseif (str_contains($searchString, 'мышь') || str_contains($searchString, 'мышка') || str_contains($searchString, 'трекпад') || str_contains($searchString, 'trackpad')) {
                    $catData = ['name' => 'Мыши', 'slug' => 'mysi']; // Поглотит вертикальные мыши и трекпады
                } elseif (str_contains($searchString, 'корпус')) {
                    $catData =['name' => 'Корпуса', 'slug' => 'korpusa'];
                } else {
                    $catName = $item['specifications']['Тип'] ?? 'Прочее';
                    $catData =['name' => \Illuminate\Support\Str::title($catName), 'slug' => \Illuminate\Support\Str::slug($catName)];
                }

                // 1. Создаем категорию
                $category = Category::firstOrCreate(['slug' => $catData['slug']], ['name' => $catData['name']]);

                // 2. Бренд
                $manufacturerName = null;
                if (isset($item['specifications']['Модель'])) {
                    $manufacturerName = explode(' ', $item['specifications']['Модель'])[0];
                }
                $manufacturer = $manufacturerName ? Manufacturer::firstOrCreate(
                    ['name' => $manufacturerName],['slug' => \Illuminate\Support\Str::slug($manufacturerName)]
                ) : null;

                // 3. Товар
                $product = Product::firstOrCreate(
                    ['slug' => 'product-' . ($item['short_id'] ?? \Illuminate\Support\Str::random(8))],[
                        'category_id' => $category->id,
                        'manufacturer_id' => $manufacturer ? $manufacturer->id : null,
                        'name' => $item['name'],
                        'price' => $item['price'] ?? 0,
                        'quantity' => rand(5, 50),
                        'status' => 'активен'
                    ]
                );

                // 4. Картинка
                if (!empty($item['image_url'])) {
                    \App\Models\ProductImage::firstOrCreate(['product_id' => $product->id, 'path' => $item['image_url']], ['is_main' => true]
                    );
                }

                // 5. Характеристики EAV
                if (!empty($item['specifications']) && is_array($item['specifications'])) {
                    foreach ($item['specifications'] as $specName => $specValue) {
                        $attribute = \App\Models\Attribute::firstOrCreate(['name' => trim($specName)]);
                        $product->attributes()->syncWithoutDetaching([
                            $attribute->id => ['value' => trim($specValue)]
                        ]);
                    }
                }
            });

            $this->newLine(2); // Делаем отступ между файлами в консоли
        }

        $this->info("Импорт ВСЕХ файлов успешно завершен! Твоя база EAV наполнена.");
    }
}