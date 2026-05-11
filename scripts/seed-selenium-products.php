<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$manufacturer = App\Models\Manufacturer::firstOrCreate(
    ['slug' => 'selenium-brand'],
    ['name' => 'Selenium Brand']
);

$slugs = [
    'korpusa',
    'materinskie-platy',
    'processory',
    'kulery-dlia-processora',
    'operativnaia-pamiat',
    'videokarty',
    'm2-ssd-nakopiteli',
    'sata-ssd-nakopiteli',
    'zestkii-disk',
    'bloki-pitaniia',
];

foreach ($slugs as $slug) {
    $category = App\Models\Category::firstOrCreate(
        ['slug' => $slug],
        ['name' => strtoupper($slug), 'type' => 'component']
    );

    App\Models\Product::firstOrCreate(
        ['slug' => 'selenium-' . $slug],
        [
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'name' => 'Selenium ' . strtoupper($slug),
            'description' => 'Auto-created for selenium UI test',
            'price' => 9999,
            'quantity' => 10,
            'status' => 'активен',
        ]
    );
}

echo "Seeded selenium products.\n";
