<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use App\Models\Assembly;
use App\Models\Review;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit',[
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail && ! $request->user()->hasVerifiedEmail(),
            'status' => session('status'),
            'user' => $request->user()->toArray(),
        ]);
    }

    public function orders(Request $request): Response
    {
        $orders = $request->user()->orders()
            ->with([
                'items.product' => function ($q) {
                    $q->with(['images' => fn($imgQ) => $imgQ->where('is_main', true)]);
                },
                'promocode',
            ])
            ->latest()
            ->get();

        return Inertia::render('Profile/Orders', [
            'orders' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => $order->total_amount,
                    'discount_amount' => $order->discount_amount ?? 0,
                    'status' => $order->status,
                    'payment_method' => $order->payment_method,
                    'delivery_method' => $order->delivery_method,
                    'delivery_address' => $order->delivery_address,
                    'delivery_time' => $order->delivery_time ? $order->delivery_time->format('d.m.Y H:i') : null,
                    'comment' => $order->comment,
                    'promocode' => $order->promocode ? $order->promocode->code : null,
                    'created_at' => $order->created_at->format('d.m.Y H:i'),
                    'items_count' => $order->items->sum('quantity'),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'product_name' => $item->product_name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'product_slug' => $item->product->slug ?? null,
                            'image_url' => optional($item->product?->images?->first())->path
                                ?? '/images/default_product.png',
                        ];
                    }),
                ];
            }),
        ]);
    }

    public function reviews(Request $request): Response
    {
        $reviews = Review::query()
            ->where('user_id', $request->user()->id)
            ->with('product')
            ->latest()
            ->get();

        return Inertia::render('Profile/Reviews', [
            'reviews' => $reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'body' => $review->body,
                    'is_approved' => (bool) $review->is_approved,
                    'created_at' => $review->created_at->format('d.m.Y H:i'),
                    'product_name' => $review->product?->name ?? 'Удаленный товар',
                    'product_slug' => $review->product?->slug,
                ];
            }),
        ]);
    }

    public function assemblies(Request $request): Response
    {
        $assemblies = Assembly::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'products' => function ($q) {
                    $q->with([
                        'category:id,name,slug',
                        'images' => fn($imgQ) => $imgQ->where('is_main', true),
                    ]);
                },
            ])
            ->latest()
            ->get();

        return Inertia::render('Profile/Assemblies', [
            'assemblies' => $assemblies->map(function ($assembly) {
                $total = $assembly->products->sum('price');
                return [
                    'id' => $assembly->id,
                    'name' => $assembly->name,
                    'description' => $assembly->description,
                    'items_count' => $assembly->products->count(),
                    'total_amount' => $total,
                    'created_at' => $assembly->created_at->format('d.m.Y H:i'),
                    'items' => $assembly->products->map(function ($product) {
                        return [
                            'id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'price' => $product->price,
                            'image_url' => optional($product->images->first())->path
                                ?? '/images/default_product.png',
                            'category_name' => $product->category?->name,
                            'category_slug' => $product->category?->slug,
                        ];
                    }),
                ];
            }),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());
        if ($request->user()->isDirty('email')) $request->user()->email_verified_at = null;
        $request->user()->save();
        return Redirect::route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);
        $user = $request->user();
        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return Redirect::to('/');
    }
}