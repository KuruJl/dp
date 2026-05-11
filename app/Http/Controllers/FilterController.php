<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class FilterController extends Controller
{
    public function getFiltersForCategory(string $categorySlug): JsonResponse
    {
        // 1. Ищем категорию
        $category = Category::where('slug', $categorySlug)->first();

        if (!$category) {
            return response()->json([
                'price' => ['min' => 0, 'max' => 0],
                'manufacturers' => [],
                'specs' =>[]
            ]);
        }

        // 2. Достаем все активные товары этой категории со связями
        $products = Product::where('category_id', $category->id)
            ->where('status', 'активен')
            ->with(['manufacturer', 'attributes'])
            ->get();

        if ($products->isEmpty()) {
            return response()->json([
                'price' =>['min' => 0, 'max' => 0],
                'manufacturers' =>[],
                'specs' =>[]
            ]);
        }

        // 3. Считаем минимальную и максимальную цену
        $minPrice = $products->min('price') ?? 0;
        $maxPrice = $products->max('price') ?? 0;

        // 4. Собираем уникальных производителей
        $manufacturers = $products->pluck('manufacturer')->filter()->unique('id')->values();

        // --- 5. ФИЛЬТРЫ ---
        // Для популярных категорий задаем понятный белый список (чтобы не показывать мусор),
        // для остальных используем безопасный динамический сбор.

        $allowListByCategorySlug = [
            'processory' => [
                'Сокет',
                'Общее количество ядер',
                'Тип памяти',
                'Тепловыделение (TDP)',
                'Ядро',
                'Максимальное число потоков',
            ],
            'materinskie-platy' => [
                'Сокет',
                'Чипсет AMD',
                'Чипсет Intel',
                'Тип поддерживаемой памяти',
                'Форм-фактор',
                'Количество слотов памяти',
            ],
            'kulery-dlia-processora' => [
                // «Сокет» у DNS часто — один длинный список на товар; уникальных строк >20 → из фильтра выпадает
                'Тип конструкции',
                'Рассеиваемая мощность',
                'Размеры комплектных вентиляторов',
                'Тип подсветки',
                'Разъем для подключения вентиляторов',
            ],
            'operativnaia-pamiat' => [
                'Тип памяти',
                'Суммарный объем памяти всего комплекта',
                'Тактовая частота',
                'Количество модулей в комплекте',
                'Объем одного модуля памяти',
            ],
            'm2-ssd-nakopiteli' => [
                'Объем накопителя',
                'Физический интерфейс',
                'Форм-фактор',
                'NVMe',
                'Количество бит на ячейку',
            ],
            'sata-ssd-nakopiteli' => [
                'Объем накопителя',
                'Разъем подключения',
                'DRAM буфер',
                'Максимальная скорость последовательного чтения',
                'Максимальная скорость последовательной записи',
            ],
            'zestkii-disk' => [
                'Объем HDD',
                'Скорость вращения шпинделя',
                'Интерфейс',
                'Назначение',
            ],
            'bloki-pitaniia' => [
                'Мощность (номинал)',
                'Сертификат 80 PLUS',
                'Форм-фактор',
                'Отстегивающиеся кабели',
                'Разъемы для питания видеокарты (PCI-E)',
            ],
            'korpusa' => [
                'Типоразмер корпуса',
                'Форм-фактор совместимых плат',
                'Размещение блока питания',
                'Максимальная длина устанавливаемой видеокарты',
                'Максимальная высота процессорного кулера',
            ],
            'videokarty' => [
                'Графический процессор',
                'Объем видеопамяти',
                'Тип памяти',
                'Интерфейс подключения',
                'Разрядность шины памяти',
                'Тип охлаждения',
                'Разъемы дополнительного питания',
            ],
            'klaviatury' => [
                'Тип клавиатуры',
                'Тип подключения',
                'Формат клавиатуры',
                'Подсветка клавиш',
                'Язык раскладки',
                'Раскладка клавиатуры',
                'Тип переключателей',
                'Модель переключателей',
                'Hot Swap',
            ],
            'mysi' => [
                'Тип сенсора мыши',
                'Интерфейс подключения',
                'Тип подключения',
            ],
            'monitory' => [
                'Диагональ экрана',
                'Разрешение',
                'Тип матрицы',
                'Частота обновления экрана',
                'Интерфейс подключения',
            ],
        ];

        $allowedSpecs = $allowListByCategorySlug[$categorySlug] ?? null;

        // Игнорируем заведомо мусорные/уникальные для каждого товара характеристики (для динамического режима)
        $blacklistContains = [
            'гаранти',
            'стран',
            'код производит',
            'комплектац',
            'срок эксплуатац',
            'описан',
            'ширин',
            'высот',
            'глубин',
            'длина',
            'толщин',
            'вес',
            'штатная частота',
            'турбочастот',
            'эффективная частота',
            'количество универсальных',
            'количество линий',
            'особенност',
            'дополнительн',
        ];

        $rawSpecs = [];
        foreach ($products as $product) {
            foreach ($product->attributes as $attribute) {
                $attrName = trim((string) $attribute->name);
                $attrValue = trim((string) ($attribute->pivot->value ?? ''));
                if ($attrName === '' || $attrValue === '') continue;

                // Белый список по категории (если задан)
                if (is_array($allowedSpecs) && !in_array($attrName, $allowedSpecs, true)) {
                    continue;
                }

                $attrNameLower = mb_strtolower($attrName);

                $isBlack = false;
                // В allowlist-режиме blacklist не применяем (там и так только нужное)
                if (!is_array($allowedSpecs)) {
                    foreach ($blacklistContains as $needle) {
                        if (mb_stripos($attrNameLower, $needle) !== false) {
                            $isBlack = true;
                            break;
                        }
                    }
                }
                if ($isBlack) continue;

                if (!isset($rawSpecs[$attrName])) {
                    $rawSpecs[$attrName] = [];
                }
                $rawSpecs[$attrName][$attrValue] = ($rawSpecs[$attrName][$attrValue] ?? 0) + 1;
            }
        }

        // Оставляем только характеристики, по которым реально можно фильтровать:
        // >= 2 уникальных значения и <= 20 (иначе это скорее размер/уникальные числа)
        $specs = [];
        foreach ($rawSpecs as $name => $valueMap) {
            $uniqueValues = array_keys($valueMap);
            if (count($uniqueValues) < 2 || count($uniqueValues) > 20) continue;

            // Упорядочим по частоте встречаемости
            arsort($valueMap);
            $specs[$name] = array_values(array_keys($valueMap));
        }

        // Для категорий с белым списком сохраняем порядок полей (важен для модалки конфигуратора).
        if (is_array($allowedSpecs)) {
            $orderedSpecs = [];
            foreach ($allowedSpecs as $preferredName) {
                if (isset($specs[$preferredName])) {
                    $orderedSpecs[$preferredName] = $specs[$preferredName];
                }
            }
            $specs = $orderedSpecs;
        }

        // Возвращаем данные во фронтенд
        return response()->json([
            'price' =>[
                'min' => (int) $minPrice,
                'max' => (int) $maxPrice
            ],
            'manufacturers' => $manufacturers,
            'specs' => $specs
        ]);
    }

}