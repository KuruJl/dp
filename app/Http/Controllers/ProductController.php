<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request): \Inertia\Response 
    {
        try {
            // Если пользователь ищет без выбранной категории, но запрос однозначно указывает на категорию
            // (например "жесткий диск"), добавляем category в URL, чтобы на фронте появились фильтры.
            if ((!$request->has('category') || empty($request->query('category'))) && $request->filled('search')) {
                $searchTerm = trim((string) $request->input('search'));
                $terms = preg_split('/\s+/u', $searchTerm, -1, PREG_SPLIT_NO_EMPTY);

                $categorySynonyms = [
                    'videokarty'              => ['видеокарт', 'видюх', 'видео', 'gpu', 'графич'],
                    'processory'              => ['процессор', 'проц', 'cpu'],
                    'materinskie-platy'       => ['материнк', 'материнск', 'мать', 'motherboard', 'платы'],
                    'operativnaia-pamiat'     => ['оператив', 'озу', 'ram', 'память', 'ddr'],
                    'kulery-dlia-processora'  => ['кулер', 'охлажден', 'cooler'],
                    'korpusa'                 => ['корпус', 'case'],
                    'bloki-pitaniia'          => ['блок питан', 'бп', 'psu'],
                    'zestkii-disk'            => ['жесткий диск', 'жёсткий диск', 'жест', 'hdd', 'винт'],
                    'sata-ssd-nakopiteli'     => ['ссд', 'ssd', 'sata', 'накопитель'],
                    'm2-ssd-nakopiteli'       => ['м2', 'm.2', 'nvme', 'эм2', 'm2'],
                    'mysi'                    => ['мыш', 'mouse'],
                    'klaviatury'              => ['клав', 'keyboard'],
                    'monitory'                => ['монитор', 'монит', 'экран'],
                    'nausniki-dlia-pk'        => ['наушник', 'гарнитур', 'headphone', 'headset'],
                    'kovriki-dlia-mysi'       => ['коврик', 'mousepad'],
                ];

                $matched = [];
                foreach ($terms as $term) {
                    $lower = mb_strtolower($term);
                    foreach ($categorySynonyms as $slug => $needles) {
                        foreach ($needles as $needle) {
                            if (mb_stripos($lower, $needle) !== false || mb_stripos($needle, $lower) !== false) {
                                $matched[$slug] = true;
                                break;
                            }
                        }
                    }
                }

                $matchedSlugs = array_keys($matched);
                if (count($matchedSlugs) === 1) {
                    $slug = $matchedSlugs[0];
                    return redirect()->route('catalog.search', array_merge(
                        $request->query(),
                        ['category' => $slug]
                    ));
                }
            }

            $query = Product::query()->with([
                'category', 
                'manufacturer',
                'attributes', 
                'images' => fn($q) => $q->where('is_main', true)
            ])->where('status', 'активен'); 
            // Чтобы на выдаче сначала шли товары, у которых реально есть характеристики
            $query->withCount('attributes');

            if ($request->filled('min_price')) $query->where('price', '>=', $request->min_price);
            if ($request->filled('max_price')) $query->where('price', '<=', $request->max_price);
            
            if ($request->has('category') && !empty($request->category)) {
                $categoryParam = $request->query('category');
                $categories = is_array($categoryParam) ? $categoryParam : [$categoryParam];
                $query->whereHas('category', function($q) use ($categories) {
                    $q->whereIn('slug', $categories)->orWhereIn('id', $categories);
                });
            }
            
            if ($request->filled('search')) { 
                $searchTerm = trim($request->search);
                $terms = preg_split('/\s+/u', $searchTerm, -1, PREG_SPLIT_NO_EMPTY);

                // Словарь «короткое/разговорное слово» -> слагам категорий
                $categorySynonyms = [
                    'videokarty'              => ['видеокарт', 'видюх', 'видео', 'gpu', 'графич'],
                    'processory'              => ['процессор', 'проц', 'cpu'],
                    'materinskie-platy'       => ['материнк', 'материнск', 'мать', 'motherboard', 'платы'],
                    'operativnaia-pamiat'     => ['оператив', 'озу', 'ram', 'память', 'ddr'],
                    'kulery-dlia-processora'  => ['кулер', 'охлажден', 'cooler'],
                    'korpusa'                 => ['корпус', 'case'],
                    'bloki-pitaniia'          => ['блок питан', 'бп', 'psu'],
                    'zestkii-disk'            => ['жесткий диск', 'жёсткий диск', 'жест', 'hdd', 'винт'],
                    'sata-ssd-nakopiteli'     => ['ссд', 'ssd', 'sata', 'накопитель'],
                    'm2-ssd-nakopiteli'       => ['м2', 'm.2', 'nvme', 'эм2', 'm2'],
                    'mysi'                    => ['мыш', 'mouse'],
                    'klaviatury'              => ['клав', 'keyboard'],
                    'monitory'                => ['монитор', 'монит', 'экран'],
                    'nausniki-dlia-pk'        => ['наушник', 'гарнитур', 'headphone', 'headset'],
                    'kovriki-dlia-mysi'       => ['коврик', 'mousepad'],
                ];

                $matchedCategorySlugs = [];
                foreach ($terms as $term) {
                    $lower = mb_strtolower($term);
                    foreach ($categorySynonyms as $slug => $needles) {
                        foreach ($needles as $needle) {
                            if (mb_stripos($lower, $needle) !== false || mb_stripos($needle, $lower) !== false) {
                                $matchedCategorySlugs[$slug] = true;
                                break;
                            }
                        }
                    }
                }
                $matchedCategorySlugs = array_keys($matchedCategorySlugs);

                // Фильтруем «шумовые» слова, которые уже дали нам категорию
                $categoryNeedlesFlat = [];
                foreach ($categorySynonyms as $slug => $needles) {
                    if (in_array($slug, $matchedCategorySlugs, true)) {
                        $categoryNeedlesFlat = array_merge($categoryNeedlesFlat, array_map('mb_strtolower', $needles));
                    }
                }

                $remainingTerms = array_values(array_filter($terms, function ($term) use ($categoryNeedlesFlat) {
                    $lower = mb_strtolower($term);
                    foreach ($categoryNeedlesFlat as $needle) {
                        if (mb_stripos($lower, $needle) !== false || mb_stripos($needle, $lower) !== false) {
                            return false;
                        }
                    }
                    return true;
                }));

                $query->where(function ($outer) use ($terms, $remainingTerms, $matchedCategorySlugs) {
                    if (!empty($matchedCategorySlugs)) {
                        $outer->orWhereHas('category', function ($cq) use ($matchedCategorySlugs) {
                            $cq->whereIn('slug', $matchedCategorySlugs);
                        });
                    }

                    // Классический полнотекстовый поиск по name+description по всем терминам
                    $outer->orWhere(function ($full) use ($terms) {
                        foreach ($terms as $term) {
                            $full->where(function ($q) use ($term) {
                                $q->where('name', 'like', '%'.$term.'%')
                                    ->orWhere('description', 'like', '%'.$term.'%');
                            });
                        }
                    });

                    // И «узкий» поиск: категория совпала + остальные слова встречаются в имени
                    if (!empty($matchedCategorySlugs) && !empty($remainingTerms)) {
                        $outer->orWhere(function ($narrow) use ($matchedCategorySlugs, $remainingTerms) {
                            $narrow->whereHas('category', function ($cq) use ($matchedCategorySlugs) {
                                $cq->whereIn('slug', $matchedCategorySlugs);
                            });
                            foreach ($remainingTerms as $term) {
                                $narrow->where(function ($q) use ($term) {
                                    $q->where('name', 'like', '%'.$term.'%')
                                        ->orWhere('description', 'like', '%'.$term.'%');
                                });
                            }
                        });
                    }
                });
            }

            if ($request->has('manufacturers')) {
                $manufacturersParam = $request->input('manufacturers', []);
                $manufacturers = is_array($manufacturersParam) ? $manufacturersParam : [$manufacturersParam];
                $manufacturers = array_values(array_filter($manufacturers, fn($item) => !empty($item)));

                if (!empty($manufacturers)) {
                    $query->whereHas('manufacturer', function($q) use ($manufacturers) {
                        $q->whereIn('name', $manufacturers);
                    });
                }
            }

            $specFilters = $request->input('specs', []);
            if (is_array($specFilters) && !empty($specFilters)) {
                foreach ($specFilters as $specName => $valuesParam) {
                    $values = is_array($valuesParam) ? $valuesParam : [$valuesParam];
                    $values = array_values(array_filter($values, fn($item) => !empty($item)));

                    if (empty($values)) {
                        continue;
                    }

                    $query->whereHas('attributes', function($q) use ($specName, $values) {
                        $q->where('attributes.name', $specName)
                            ->whereIn('attribute_product.value', $values);
                    });
                }
            }
            
            $sortBy = $request->query('sort', 'popular');
            if ($sortBy === 'price_asc') $query->orderBy('price', 'asc');
            elseif ($sortBy === 'price_desc') $query->orderBy('price', 'desc');
            else $query->orderByDesc('attributes_count')->orderBy('id', 'desc');
            
            $products = $query->paginate(12)->withQueryString();
            
            // МАГИЯ: Безопасно отдаем данные, переименовав attributes в specs
            $products->getCollection()->transform(function($product) {
                $data = $product->toArray();
                $data['image_url'] = $product->images->first()?->path ?? '/images/default_product.png';
                // Приводим к обычному массиву, чтобы фронт не ловил "пустые" коллекции на некоторых категориях
                $attrs = $product->getRelation('attributes');
                $attrsArray = $attrs ? $attrs->values()->toArray() : [];
                $data['attributes'] = $attrsArray;
                $data['specs'] = $attrsArray;
                return $data;
            });

            return Inertia::render('CatalogSearch',[
                'products' => $products,
                'categories' => Category::all(),
                'initialMinPrice' => $request->input('min_price'),
                'initialMaxPrice' => $request->input('max_price'),
                'initialCategoryIds' => is_array($request->input('category')) ? $request->input('category') : [], 
                'initialSearch' => $request->input('search'),
                'initialManufacturers' => $request->input('manufacturers', []),
                'initialSpecs' => $request->input('specs', []),
                'initialSort' => $sortBy,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in index: '.$e->getMessage());
            return back()->with('error', 'Произошла ошибка при загрузке каталога');
        }
    }

    public function apiIndex(Request $request): \Illuminate\Http\JsonResponse
    {
        $perPage = (int) $request->query('per_page', 12);
        if ($perPage < 1) $perPage = 12;
        if ($perPage > 36) $perPage = 36;

        $query = Product::query()->with(['manufacturer', 'category', 'attributes', 'images' => fn($q) => $q->where('is_main', true)])
            ->where('price', '>=', 0)->where('status', 'активен');

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }

        if ($request->has('category')) {
            $categorySlug = $request->query('category');
            $category = Category::where('slug', $categorySlug)->first();
            if (!$category) return response()->json([]); 
            $query->where('category_id', $category->id);

            // Дополнительная защита от "кривой" категоризации после импорта:
            // проверяем, что характеристика "Тип" соответствует ожидаемому классу товара.
            $typeGuardByCategory = [
                'korpusa' => ['корпус'],
                'materinskie-platy' => ['материнская плата'],
                'processory' => ['процессор', 'cpu'],
                'kulery-dlia-processora' => ['кулер', 'система охлаждения'],
                'operativnaia-pamiat' => ['оперативная память', 'dimm'],
                'videokarty' => ['видеокарта', 'gpu'],
                'm2-ssd-nakopiteli' => ['ssd', 'm.2', 'm2'],
                'sata-ssd-nakopiteli' => ['ssd', 'sata', '2.5'],
                'zestkii-disk' => ['жесткий диск', 'hdd'],
                'bloki-pitaniia' => ['блок питания', 'psu'],
            ];

            $nameFallbackByCategory = [
                'korpusa' => ['корпус'],
                'materinskie-platy' => ['материнская плата'],
                'processory' => ['процессор', 'cpu'],
                'kulery-dlia-processora' => ['кулер', 'система охлаждения'],
                'operativnaia-pamiat' => ['оперативная память', 'dimm'],
                'videokarty' => ['видеокарта', 'gpu'],
                // Для M.2 не используем общий "m2", чтобы не ловить посторонние товары.
                'm2-ssd-nakopiteli' => ['m.2', 'nvme', 'ssd m.2'],
                'sata-ssd-nakopiteli' => ['ssd', 'sata', '2.5'],
                'zestkii-disk' => ['жесткий диск', 'hdd'],
                'bloki-pitaniia' => ['блок питания', 'psu'],
            ];

            if (isset($typeGuardByCategory[$categorySlug])) {
                $allowedKeywords = $typeGuardByCategory[$categorySlug];
                $query->where(function ($guardQuery) use ($allowedKeywords, $categorySlug, $nameFallbackByCategory) {
                    $guardQuery->whereHas('attributes', function ($q) use ($allowedKeywords) {
                        $q->where('attributes.name', 'Тип')
                            ->where(function ($typeQuery) use ($allowedKeywords) {
                                foreach ($allowedKeywords as $keyword) {
                                    $typeQuery->orWhere('attribute_product.value', 'like', '%' . $keyword . '%');
                                }
                            });
                    })->orWhere(function ($nameQuery) use ($categorySlug, $nameFallbackByCategory) {
                        $nameKeywords = $nameFallbackByCategory[$categorySlug] ?? [];
                        foreach ($nameKeywords as $keyword) {
                            $nameQuery->orWhere('name', 'like', '%' . $keyword . '%');
                        }
                    });
                });
            }
        } else {
            return response()->json([]); 
        }

        if ($request->has('manufacturers')) {
            $manufacturersParam = $request->input('manufacturers', []);
            $manufacturers = is_array($manufacturersParam) ? $manufacturersParam : [$manufacturersParam];
            $manufacturers = array_values(array_filter($manufacturers, fn($item) => !empty($item)));

            if (!empty($manufacturers)) {
                $query->whereHas('manufacturer', function($q) use ($manufacturers) {
                    $q->whereIn('id', $manufacturers);
                });
            }
        }

        $specFilters = $request->input('specs', []);
        if (is_array($specFilters) && !empty($specFilters)) {
            foreach ($specFilters as $specName => $valuesParam) {
                $values = is_array($valuesParam) ? $valuesParam : [$valuesParam];
                $values = array_values(array_filter($values, fn($item) => $item !== null && $item !== ''));

                if (empty($values)) {
                    continue;
                }

                $query->whereHas('attributes', function($q) use ($specName, $values) {
                    $q->where('attributes.name', $specName)
                        ->whereIn('attribute_product.value', $values);
                });
            }
        }

        if ($request->filled('search')) {
            $searchTerm = trim($request->input('search'));
            $terms = preg_split('/\s+/u', $searchTerm, -1, PREG_SPLIT_NO_EMPTY);
            foreach ($terms as $term) {
                $query->where(function($q) use ($term) {
                    $q->where('name', 'like', '%' . $term . '%')
                        ->orWhere('description', 'like', '%' . $term . '%');
                });
            }
        }

        $components = $query->paginate($perPage)->appends($request->query());

        $components->getCollection()->transform(function($product) {
            $data = $product->toArray();
            $data['image_url'] = $product->images->first()?->path ?? '/images/default_product.png';
            $data['specs'] = $product->getRelation('attributes'); // Обход бага Laravel
            if ($product->category) {
                $data['category']['type'] = 'component'; 
            }
            return $data;
        });

        return response()->json([
            'data' => $components->items(),
            'meta' => [
                'current_page' => $components->currentPage(),
                'last_page' => $components->lastPage(),
                'per_page' => $components->perPage(),
                'total' => $components->total(),
                'from' => $components->firstItem(),
                'to' => $components->lastItem(),
            ],
        ]);
    }

    public function apiShow(Product $product): \Illuminate\Http\JsonResponse
    {
        $product->load(['category', 'manufacturer', 'images', 'attributes']);
        $data = $product->toArray();
        $data['image_url'] = $product->images->first()?->path ?? '/images/default_product.png';
        $data['specs'] = $product->getRelation('attributes');
        return response()->json($data);
    }

    public function show($slug)
    {
        try {
            $product = Product::with([
                'category', 'images', 'attributes',
                'reviews' => fn($q) => $q->where('is_approved', true)->with('user:id,name')->latest()
            ])->where('slug', $slug)->firstOrFail();

            $data = $product->toArray();
            $data['average_rating'] = $product->reviews->avg('rating') ?? 0;
            $data['image_url'] = $product->images->first()?->path ?? '/images/default_product.png';
            $data['specs'] = $product->getRelation('attributes'); // Обход бага Laravel

            $user = auth()->user();
            $hasPurchased = false;
            $hasReviewed = false;
            if ($user) {
                $hasPurchased = \App\Models\OrderItem::where('product_id', $product->id)
                    ->whereHas('order', function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->whereNotIn('status', ['отменен', 'cancelled', 'отменён']);
                    })->exists();
                $hasReviewed = $product->reviews()->where('user_id', $user->id)->exists();
            }

            $data['can_review'] = (bool) ($user && $hasPurchased && !$hasReviewed);
            $data['has_purchased'] = (bool) $hasPurchased;
            $data['has_reviewed'] = (bool) $hasReviewed;

            $relatedProducts = Product::where('category_id', $product->category_id)
                ->where('id', '!=', $product->id)
                ->with(['images' => fn($q) => $q->where('is_main', true)]) 
                ->inRandomOrder()->limit(4)->get()
                ->map(function($p) {
                    $pData = $p->toArray();
                    $pData['image_url'] = $p->images->first()?->path ?? '/images/default_product.png';
                    return $pData;
                });

            return Inertia::render('ProductPage',[
                'product' => $data,
                'relatedProducts' => $relatedProducts,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in show: '.$e->getMessage());
            return back()->with('error', 'Товар не найден');
        }
    }
}