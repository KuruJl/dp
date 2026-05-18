<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FavoriteController extends Controller
{
    public function index()
    {
        $favorites = Auth::user()
            ->favorites()
            ->with([
                'category',
                'attributes',
                'images' => fn($q) => $q->where('is_main', true),
            ])
            ->latest('favorites.created_at')
            ->get()
            ->map(function ($product) {
                $data = $product->toArray();
                $data['image_url'] = $product->images->first()?->path ?? '/images/default_product.png';
                return $data;
            });

        return Inertia::render('Favorites', [
            'favorites' => $favorites,
        ]);
    }

    // Метод переключает статус избранного (добавляет, если нет; удаляет, если есть)
    public function toggle(Product $product)
    {
        $user = Auth::user();
        $user->favorites()->toggle($product->id);

        return back(); // Inertia сама обновит страницу в браузере без перезагрузки!
    }
}