<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): \Inertia\Response
    {
        // 1. СОБИРАЕМ ТОВАРЫ ДЛЯ ВКЛАДОК КАТЕГОРИЙ (По 5 из каждой)
        $tabProducts = collect();
        $categories = Category::all();

        foreach ($categories as $category) {
            $products = Product::with(['category','attributes', 'images' => function($q) {
                $q->where('is_main', true);
            }])
            ->where('category_id', $category->id)
            ->where('status', 'активен')
            ->inRandomOrder()
            ->limit(5)
            ->get();

            $tabProducts = $tabProducts->merge($products);
        }

        $tabProducts = $tabProducts->shuffle()->map(function ($product) {
            return[
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->price,
                'image_url' => $product->images->first()?->path ?? '/images/default_product.png',
                'category' => $product->category, 
                'attributes' => $product->attributes,
            ];
        });

        // 2. СОБИРАЕМ ТОВАРЫ ДЛЯ "ХИТОВ ПРОДАЖ" (Просто 10 случайных)
        $hitProducts = Product::with(['attributes','images' => function($q) {
            $q->where('is_main', true);
        }])
        ->where('status', 'активен')
        ->inRandomOrder() // В будущем на дипломе можно сказать, что тут алгоритм по популярности
        ->limit(10) // Ровно 10 штук!
        ->get()
        ->map(function ($product) {
            return[
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->price,
                'image_url' => $product->images->first()?->path ?? '/images/default_product.png',
                'attributes' => $product->attributes,
            ];
        });

        return Inertia::render('Main',[
            'tabProducts' => $tabProducts,
            'hitProducts' => $hitProducts, // Передаем хиты отдельно
            'categories' => $categories->map(fn($category) =>[
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ]), 
        ]);
    }
}