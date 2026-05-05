<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Promocode;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    private function getCart()
    {
        if (Auth::check()) {
            return Cart::firstOrCreate(['user_id' => Auth::id()]);
        }
        $guestToken = Cookie::get('guest_cart_token') ?? Str::uuid()->toString();
        Cookie::queue('guest_cart_token', $guestToken, 60 * 24 * 30);
        return Cart::firstOrCreate(['guest_token' => $guestToken]);
    }

    public function index(): Response
    {
        $cart = $this->getCart();
        $detailedCartItems =[];
        $total = 0;

        foreach ($cart->items()->with('product.images')->get() as $cartItem) {
            $product = $cartItem->product;
            if ($product) {
                $detailedCartItems[] =[
                    'id' => $cartItem->id, // ID самой записи в корзине (для удаления)
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'image' => $product->images->first()?->path,
                    'price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'slug' => $product->slug,
                    'max_available' => $product->quantity,
                ];
                $total += $product->price * $cartItem->quantity;
            } else {
                $cartItem->delete();
            }
        }
        
        return Inertia::render('Cart',[
            'cart' => $detailedCartItems,
            'total' => $total,
        ]);
    }

    public function previewPromocode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'promo_code' => ['nullable', 'string', 'max:100'],
        ]);

        $cart = $this->getCart();
        $subtotal = 0;
        foreach ($cart->items()->with('product')->get() as $cartItem) {
            if ($cartItem->product) {
                $subtotal += $cartItem->product->price * $cartItem->quantity;
            }
        }

        $rawCode = trim((string) ($validated['promo_code'] ?? ''));
        if ($rawCode === '') {
            return response()->json([
                'valid' => false,
                'message' => 'Введите промокод.',
                'discount_amount' => 0,
                'subtotal' => $subtotal,
                'final_total' => $subtotal,
            ]);
        }

        $code = strtoupper($rawCode);
        $promocode = Promocode::where('code', $code)->first();

        if (!$promocode) {
            return response()->json([
                'valid' => false,
                'message' => 'Промокод не существует.',
                'discount_amount' => 0,
                'subtotal' => $subtotal,
                'final_total' => $subtotal,
            ]);
        }

        if (!$promocode->isValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'Промокод недействителен или срок действия истек.',
                'discount_amount' => 0,
                'subtotal' => $subtotal,
                'final_total' => $subtotal,
            ]);
        }

        if ($subtotal < (float) $promocode->min_order_amount) {
            return response()->json([
                'valid' => false,
                'message' => "Минимальная сумма заказа для промокода: {$promocode->min_order_amount} ₽.",
                'discount_amount' => 0,
                'subtotal' => $subtotal,
                'final_total' => $subtotal,
            ]);
        }

        $discount = $this->calculateDiscount($promocode, $subtotal);
        $finalTotal = max(0, $subtotal - $discount);

        return response()->json([
            'valid' => true,
            'message' => 'Промокод применен.',
            'discount_amount' => $discount,
            'subtotal' => $subtotal,
            'final_total' => $finalTotal,
            'code' => $promocode->code,
        ]);
    }

    private function calculateDiscount(Promocode $promocode, float $subtotal): float
    {
        if ($subtotal <= 0) return 0;

        $discount = $promocode->type === 'percent'
            ? ($subtotal * ((float) $promocode->value / 100))
            : (float) $promocode->value;

        return min($subtotal, round($discount, 2));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $cart = $this->getCart();

        $cartItem = $cart->items()->where('product_id', $product->id)->first();
        $currentQuantity = $cartItem ? $cartItem->quantity : 0;
        
        if ($product->quantity < ($currentQuantity + $validated['quantity'])) {
            return back()->withErrors(['message' => "Недостаточно товара. На складе: {$product->quantity}."]);
        }

        if ($cartItem) {
            $cartItem->increment('quantity', $validated['quantity']);
        } else {
            $cart->items()->create(['product_id' => $product->id, 'quantity' => $validated['quantity']]);
        }

        return redirect()->back()->with('success', 'Товар добавлен в корзину!');
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $validated = $request->validate(['quantity' => 'required|integer|min:1']);
        $product = $cartItem->product;

        if ($product->quantity < $validated['quantity']) {
            return redirect()->back()->withErrors(['message' => "Доступно только {$product->quantity} шт."]);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);
        return redirect()->back()->with('success', 'Количество обновлено.');
    }

    public function remove(CartItem $cartItem)
    {
        $cartItem->delete();
        return redirect()->back()->with('success', 'Товар удален из корзины!');
    }
}