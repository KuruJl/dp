<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SyncProductImagesFromJson extends Command
{
    protected $signature = 'products:sync-images-from-json
        {--imports-dir=imports : Папка с JSON рядом с проектом}
        {--storage-dir=storage/app/data : Папка storage/app/data}
        {--files=* : Только эти имена файлов, например cases_dns_with_specs.json}';

    protected $description = 'Добавляет URL картинок товарам из DNS JSON (slug product-{short_id})';

    public function handle(): int
    {
        $importsDir = base_path(trim((string) $this->option('imports-dir'), '/\\'));
        $storageDir = base_path(trim((string) $this->option('storage-dir'), '/\\'));
        $onlyFiles = array_filter((array) $this->option('files'));

        $defaultNames = ['cases_dns_with_specs.json', 'carpet_dns_with_specs.json'];
        $names = $onlyFiles !== [] ? $onlyFiles : $defaultNames;

        $paths = [];
        foreach ($names as $name) {
            foreach ([$importsDir, $storageDir] as $dir) {
                if (! File::isDirectory($dir)) {
                    continue;
                }
                $full = $dir . DIRECTORY_SEPARATOR . $name;
                if (File::isFile($full)) {
                    $paths[$full] = true;
                }
            }
        }

        $paths = array_keys($paths);
        if ($paths === []) {
            $this->error('Не найдены JSON по именам: ' . implode(', ', $names));
            $this->line('Проверьте папки: ' . $importsDir . ', ' . $storageDir);

            return self::FAILURE;
        }

        $added = 0;
        $skippedNoProduct = 0;
        $skippedNoUrl = 0;

        foreach ($paths as $path) {
            $this->info('Файл: ' . $path);
            $rows = json_decode(File::get($path), true);
            if (! is_array($rows)) {
                $this->warn('Пропуск: невалидный JSON.');

                continue;
            }

            foreach ($rows as $item) {
                $url = isset($item['image_url']) ? trim((string) $item['image_url']) : '';
                if ($url === '') {
                    $skippedNoUrl++;

                    continue;
                }

                $shortId = isset($item['short_id']) ? trim((string) $item['short_id']) : '';
                if ($shortId === '') {
                    continue;
                }

                $slug = 'product-' . $shortId;
                $product = Product::query()->where('slug', $slug)->first();
                if (! $product) {
                    $skippedNoProduct++;

                    continue;
                }

                $exists = ProductImage::query()
                    ->where('product_id', $product->id)
                    ->where('path', $url)
                    ->exists();

                if ($exists) {
                    continue;
                }

                $hasMain = ProductImage::query()
                    ->where('product_id', $product->id)
                    ->where('is_main', true)
                    ->exists();

                ProductImage::query()->create([
                    'product_id' => $product->id,
                    'path' => $url,
                    'is_main' => ! $hasMain,
                ]);
                $added++;
            }
        }

        $this->info("Добавлено изображений: {$added}");
        $this->line("Строк без image_url в JSON: {$skippedNoUrl}");
        $this->line("Товаров нет в БД (slug): {$skippedNoProduct}");

        return self::SUCCESS;
    }
}
