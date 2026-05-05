<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'body' => 'required|string|min:5|max:1000',
        ]);

        $userId = Auth::id();

        $hasPurchased = OrderItem::where('product_id', $product->id)
            ->whereHas('order', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->whereNotIn('status', ['отменен', 'cancelled', 'отменён']);
            })->exists();

        if (!$hasPurchased) {
            return back()->withErrors([
                'review' => 'Оставить отзыв можно только после покупки этого товара.',
            ]);
        }

        if ($product->reviews()->where('user_id', $userId)->exists()) {
            return back()->withErrors([
                'review' => 'Вы уже оставили отзыв на этот товар.',
            ]);
        }

        $product->reviews()->create([
            'user_id' => $userId,
            'rating' => $validated['rating'],
            'body' => $validated['body'],
            'is_approved' => false,
        ]);

        return back()->with('success', 'Спасибо! Ваш отзыв отправлен на модерацию и скоро появится на сайте.');
    }
}