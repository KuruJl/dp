<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Component;
use Illuminate\Support\Str;

class ComponentSeeder extends Seeder
{
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Category::truncate();
        Manufacturer::truncate();
        Component::truncate();

        // Полный словарь всех возможных брендов и технологий
        $knownManufacturers = [
            '1STPLAYER', 'A4Tech', 'ABR technology', 'Accord', 'ACD', 'Acer', 'ADATA',
            'Advantech', 'AeroCool', 'AFOX', 'AGI', 'Akasa', 'Alseye', 'AMD', 'Apacer', 'APNX',
            'Arctic', 'ARDOR GAMING', 'ASRock', 'ASUS', 'AORUS', 'Azerty', 'AZZA',
            'BaseTech', 'be quiet!', 'Biostar', 'Bloody', 'CBR', 'Chieftec', 'ColorFul',
            'Cooler Master', 'CoolerMaster', 'Corsair', 'Cougar', 'Crown', 'Crucial',
            'Dahua', 'DarkFlash', 'DEEPCOOL', 'Dell', 'DEXP', 'Digma', 'Enermax',
            'Esonic', 'ExeGate', 'Formula', 'Foxconn', 'Foxline', 'Fractal Design', 'FSP',
            'G.Skill', 'Gainward', 'GAMDIAS', 'GameMax', 'GamerStorm', 'Geometric Future',
            'GIGABYTE', 'GiNZZU', 'High Power', 'Hikvision', 'HIPER', 'HP', 'HyperX',
            'Intel', 'Inno3D', 'InWin', 'Iron Pride', 'JONSBO', 'KFA2', 'KingPrice',
            'KingSpec', 'Kingston', 'KIOXIA', 'Lamptron', 'LG', 'Lian Li', 'LinkWorld',
            'Matrox', 'MaxSun', 'Micron', 'Montech', 'MSI', 'Neo Forza', 'Netac',
            'Noctua', 'NVIDIA', 'nVidia', 'NZXT', 'Ocypus', 'OCPC Gaming', 'Oklick',
            'Palit', 'Patriot', 'PCCooler', 'Phanteks', 'PHANTEKS', 'PNY', 'PowerCase',
            'PowerColor', 'Powerman', 'QDION', 'QUMO', 'RAIJINTEK', 'Raskat', 'Razer',
            'Redragon', 'Safe SSD', 'Samsung', 'Sapphire', 'Seagate', 'Sharkoon',
            'Silicon Power', 'SilverStone', 'Sinotex', 'Smartbuy', 'Soeyi', 'Solidigm',
            'SteelSeries', 'SunWind', 'Super Flower', 'Synology', 'Tammuz', 'Team Group',
            'Thermaltake', 'Toshiba', 'Transcend', 'Valkyrie', 'ViewSonic', 'WD',
            'Western Digital', 'WIZMAX', 'XASTRA', 'Xilence', 'Xiaomi', 'XPG', 'ZALMAN',
            'Zotac',
        ];

        // Приоритетные бренды, которые являются производителями самого устройства
        $priorityManufacturers = [
            // --- САМЫЙ ВЫСОКИЙ ПРИОРИТЕТ: Производители готовых устройств ---
            'MSI', 'GIGABYTE', 'ASUS', 'ASRock', 'Palit', 'Sapphire', 'Zotac', 'Inno3D', 'KFA2', 'PowerColor', 'Gainward',
            'Kingston', 'Corsair', 'Crucial', 'G.Skill', 'ADATA', 'Samsung', 'Patriot',
            'Western Digital', 'Seagate', 'Toshiba',
            'DeepCool', 'Noctua', 'be quiet!', 'Zalman', 'Cooler Master',
            'Chieftec', 'FSP', 'Thermaltake',
            'Lian Li', 'Fractal Design', 'NZXT',
            // Мониторы и периферия
            'LG', 'Dell', 'BenQ', 'AOC', 'HP', 'Acer', 'ViewSonic', 'Xiaomi', 'Huawei',
            'Logitech', 'Razer', 'SteelSeries', 'HyperX','Logitech','Дарк Проджект','Varmilo','AJAZZ','AULA','RED SQUARE','ROYAL KLUDGE','ATTACK SHARK','8BITDO','GEMBIRD','ACELINE',
            'Lamzu','Microsoft','Оклик','Harper',' EDifier','Tline pantera','astro','baseus','audeze',
            // Бренды DNS
            'DEXP', 'ARDOR GAMING','KEYRON','TCL','HISENSE','TITAN ARMY','PHILIPS','MACHENIKE','TWS','JBL','Fifine','Apple','Sony','Marshall',
        
            // --- НИЗКИЙ ПРИОРИТЕТ: Производители чипов и технологий ---
            // Они должны идти в самом конце, чтобы не "перебивать" бренды выше.
            'Intel', 'AMD', 'NVIDIA', 
        ];
        
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
            ['file' => 'monitor_dns_with_specs.json', 'category_name' => 'Мониторы', 'type' => 'peripheral'],
            ['file' => 'keyboards_dns_with_specs.json', 'category_name' => 'Клавиатуры', 'type' => 'peripheral'],
            ['file' => 'mice_dns_with_specs.json', 'category_name' => 'Мыши', 'type' => 'peripheral'],
            ['file' => 'headphoness_dns_with_specs.json', 'category_name' => 'Наушники для ПК', 'type' => 'peripheral'],       
            ['file' => 'hdd_dns_with_specs.json', 'category_name' => 'Жесткий диск', 'type' => 'component'],        ];

        foreach ($sources as $source) {
            $this->command->info("Импортируем файл: {$source['file']}");

            $path = storage_path("app/data/{$source['file']}");
            if (!File::exists($path)) {
                $this->command->error("Файл не найден: {$source['file']}");
                continue;
            }

            $components = json_decode(File::get($path), true);

            $category = Category::firstOrCreate([
                'name' => $source['category_name'],
                'slug' => Str::slug($source['category_name']),
                'type' => $source['type']
            ]);

            foreach ($components as $componentData) {
                if (empty($componentData['name'])) {
                    continue; 
                }

                $manufacturerName = 'Unknown';
                $found = false;

                // 1. Сначала ищем в списке приоритетных брендов
                foreach ($priorityManufacturers as $priorityMan) {
                    if (stripos($componentData['name'], $priorityMan) !== false) {
                        $manufacturerName = $priorityMan;
                        $found = true;
                        break;
                    }
                }

                // 2. Если не нашли, ищем в общем списке
                if (!$found) {
                    foreach ($knownManufacturers as $knownMan) {
                        if (stripos($componentData['name'], $knownMan) !== false) {
                            $manufacturerName = $knownMan;
                            break;
                        }
                    }
                }

                if ($manufacturerName === 'WD') $manufacturerName = 'Western Digital';

                $manufacturer = Manufacturer::firstOrCreate(['name' => $manufacturerName]);

                Component::create([
                    'name' => $componentData['name'],
                    'price' => $componentData['price'] ?? 0,
                    'dns_link' => $componentData['link'] ?? '',
                    'image_url' => $componentData['image_url'] ?? null, // <-- ДОБАВЬ ЭТУ СТРОКУ
                    'category_id' => $category->id,
                    'manufacturer_id' => $manufacturer->id,
                    'specifications' => is_array($componentData['specifications'])
                                        ? $componentData['specifications']
                                        : json_decode($componentData['specifications'], true),
                ]);
            }
        }
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->command->info('Импорт данных успешно завершен!');
    }
}