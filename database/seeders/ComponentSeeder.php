<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use App\Models\Attribute;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\ProductImage;

class ComponentSeeder extends Seeder
{
    /**
     * Фиксированные slug как на странице Catalog.jsx (Str::slug от русского названия может расходиться).
     */
    private function catalogSlugForSeed(string $categoryName): string
    {
        return match ($categoryName) {
            'M.2 SSD накопители' => 'm2-ssd-nakopiteli',
            'SATA SSD накопители' => 'sata-ssd-nakopiteli',
            'Жесткий диск' => 'zestkii-disk',
            'Наушники для ПК' => 'nausniki-dlia-pk',
            default => Str::slug($categoryName),
        };
    }

    public function run(): void
    {
        $sources = [
            ['file' => 'gpus_dns_with_specs.json', 'category_name' => 'Видеокарты', 'type' => 'component'],
            ['file' => 'cpus_dns_with_specs.json', 'category_name' => 'Процессоры', 'type' => 'component'],
            ['file' => 'motherboards_dns_with_specs.json', 'category_name' => 'Материнские платы', 'type' => 'component'],
            ['file' => 'ram_dns_with_specs.json', 'category_name' => 'Оперативная память', 'type' => 'component'],
            ['file' => 'cases_dns_with_specs.json', 'category_name' => 'Корпуса', 'type' => 'component'],
            ['file' => 'psu_dns_with_specs.json', 'category_name' => 'Блоки питания', 'type' => 'component'],
            ['file' => 'culer_dns_with_specs.json', 'category_name' => 'Кулеры для процессора', 'type' => 'component'],
            ['file' => 'ssd_m2_dns_with_specs.json', 'category_name' => 'M.2 SSD накопители', 'type' => 'component'],
            ['file' => 'ssd_sata_dns_with_specs.json', 'category_name' => 'SATA SSD накопители', 'type' => 'component'],
            ['file' => 'hdd_dns_with_specs.json', 'category_name' => 'Жесткий диск', 'type' => 'component'],
            ['file' => 'monitor_dns_with_specs.json', 'category_name' => 'Мониторы', 'type' => 'peripheral'],
            ['file' => 'keyboards_dns_with_specs.json', 'category_name' => 'Клавиатуры', 'type' => 'peripheral'],
            ['file' => 'mice_dns_with_specs.json', 'category_name' => 'Мыши', 'type' => 'peripheral'],
            ['file' => 'headphoness_dns_with_specs.json', 'category_name' => 'Наушники для ПК', 'type' => 'peripheral'],
        ];

        $seeded = 0;
        foreach ($sources as $source) {
            $path = storage_path("app/data/{$source['file']}");
            if (!File::exists($path)) {
                continue;
            }

            $rows = json_decode(File::get($path), true);
            if (!is_array($rows) || empty($rows)) {
                continue;
            }

            $slug = $this->catalogSlugForSeed($source['category_name']);

            $category = Category::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $source['category_name'],
                    'type' => $source['type'],
                ]
            );

            // Раньше было обрезано до 60 строк на файл — в каталоге мало SATA SSD при ~100+ в JSON.
            $limitRaw = env('COMPONENT_SEED_PER_FILE_LIMIT');
            if ($limitRaw === null || $limitRaw === '' || (int) $limitRaw <= 0) {
                $slice = $rows;
            } else {
                $slice = array_slice($rows, 0, min((int) $limitRaw, count($rows)));
            }

            foreach ($slice as $row) {
                $name = trim((string) ($row['name'] ?? ''));
                if ($name === '') continue;

                $specs = $row['specifications'] ?? [];
                if (!is_array($specs)) {
                    $decoded = json_decode((string) $specs, true);
                    $specs = is_array($decoded) ? $decoded : [];
                }

                $manufacturerName = trim((string) ($specs['Бренд'] ?? $specs['Модель'] ?? 'Unknown'));
                $manufacturerName = explode(' ', $manufacturerName)[0] ?: 'Unknown';
                $manufacturer = Manufacturer::firstOrCreate(
                    ['slug' => Str::slug($manufacturerName)],
                    ['name' => $manufacturerName]
                );

                $slugBase = 'product-' . ($row['short_id'] ?? Str::slug($name));
                $slug = Str::slug($slugBase) ?: ('product-' . Str::random(8));
                if (Product::where('slug', $slug)->exists()) {
                    $slug .= '-' . Str::lower(Str::random(4));
                }

                $product = Product::create([
                    'category_id' => $category->id,
                    'manufacturer_id' => $manufacturer->id,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $row['description'] ?? null,
                    'price' => (float) ($row['price'] ?? 0),
                    'quantity' => random_int(5, 50),
                    'status' => 'активен',
                ]);

                if (!empty($row['image_url'])) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $row['image_url'],
                        'is_main' => true,
                    ]);
                }

                foreach ($specs as $specName => $specValue) {
                    $n = trim((string) $specName);
                    $v = trim((string) $specValue);
                    if ($n === '' || $v === '') continue;
                    $attribute = Attribute::firstOrCreate(['name' => $n], ['type' => 'string']);
                    $product->attributes()->syncWithoutDetaching([$attribute->id => ['value' => $v]]);
                }

                $seeded++;
            }
        }

        // Фолбэк на случай отсутствия JSON-файлов.
        if ($seeded === 0) {
            $cpuCategory = Category::firstOrCreate(
                ['slug' => 'processory'],
                ['name' => 'Процессоры', 'type' => 'component']
            );
            $gpuCategory = Category::firstOrCreate(
                ['slug' => 'videokarty'],
                ['name' => 'Видеокарты', 'type' => 'component']
            );
            $intel = Manufacturer::firstOrCreate(['slug' => 'intel'], ['name' => 'Intel']);
            $msi = Manufacturer::firstOrCreate(['slug' => 'msi'], ['name' => 'MSI']);

            $p1 = Product::create([
                'category_id' => $cpuCategory->id,
                'manufacturer_id' => $intel->id,
                'name' => 'Процессор Intel Core i5-12400F',
                'slug' => 'intel-core-i5-12400f',
                'description' => 'Тестовый товар для сидера',
                'price' => 14990,
                'quantity' => 15,
                'status' => 'активен',
            ]);
            $p2 = Product::create([
                'category_id' => $gpuCategory->id,
                'manufacturer_id' => $msi->id,
                'name' => 'Видеокарта MSI GeForce RTX 4060',
                'slug' => 'msi-geforce-rtx-4060',
                'description' => 'Тестовый товар для сидера',
                'price' => 32990,
                'quantity' => 8,
                'status' => 'активен',
            ]);

            $aSocket = Attribute::firstOrCreate(['name' => 'Сокет'], ['type' => 'string']);
            $aGpu = Attribute::firstOrCreate(['name' => 'Графический процессор'], ['type' => 'string']);
            $p1->attributes()->syncWithoutDetaching([$aSocket->id => ['value' => 'LGA 1700']]);
            $p2->attributes()->syncWithoutDetaching([$aGpu->id => ['value' => 'GeForce RTX 4060']]);

            $seeded = 2;
        }

        $this->command?->info("Компоненты/товары заполнены. Создано: {$seeded}");
    }
}