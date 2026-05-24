<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Promocode;
use App\Services\PromocodeApplicator;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    /** Короткий список характеристик для карточки в корзине (без «технического шума»). */
    private function specPreviewForProduct(Product $product, int $limit = 6): array
    {
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

        $out = [];
        foreach ($product->attributes as $attribute) {
            $attrName = trim((string) $attribute->name);
            $attrValue = trim((string) ($attribute->pivot->value ?? ''));
            if ($attrName === '' || $attrValue === '') {
                continue;
            }
            $lower = mb_strtolower($attrName);
            $skip = false;
            foreach ($blacklistContains as $needle) {
                if (mb_stripos($lower, $needle) !== false) {
                    $skip = true;
                    break;
                }
            }
            if ($skip) {
                continue;
            }
            $out[] = ['name' => $attrName, 'value' => $attrValue];
            if (count($out) >= $limit) {
                break;
            }
        }

        return $out;
    }

    private function getCart()
    {
        if (Auth::check()) {
            return Cart::firstOrCreate(['user_id' => Auth::id()]);
        }
        $guestToken = Cookie::get('guest_cart_token') ?? Str::uuid()->toString();
        Cookie::queue('guest_cart_token', $guestToken, 60 * 24 * 30);

        return Cart::firstOrCreate(['guest_token' => $guestToken]);
    }

    private function authorizeCartItem(CartItem $cartItem): void
    {
        $cart = $this->getCart();

        if ((int) $cartItem->cart_id !== (int) $cart->id) {
            abort(403, 'Нет доступа к этой позиции корзины.');
        }
    }

    public function index(): Response
    {
        $cart = $this->getCart();
        $detailedCartItems = [];
        $total = 0;

        foreach ($cart->items()->with(['product.images', 'product.attributes'])->get() as $cartItem) {
            $product = $cartItem->product;
            if ($product) {
                $detailedCartItems[] = [
                    'id' => $cartItem->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'image' => $product->images->first()?->path,
                    'price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'slug' => $product->slug,
                    'max_available' => $product->quantity,
                    'spec_preview' => $this->specPreviewForProduct($product),
                ];
                $total += $product->price * $cartItem->quantity;
            } else {
                $cartItem->delete();
            }
        }

        return Inertia::render('Cart', [
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
        $lines = $cart->items()->with('product')->get();
        $subtotal = PromocodeApplicator::cartSubtotal($lines);

        $rawCode = trim((string) ($validated['promo_code'] ?? ''));
        if ($rawCode === '') {
            return response()->json([
                'valid' => false,
                'message' => 'Введите промокод.',
                'discount_amount' => 0,
                'subtotal' => $subtotal,
                'eligible_base' => 0,
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
                'eligible_base' => 0,
                'final_total' => $subtotal,
            ]);
        }

        $result = PromocodeApplicator::evaluate($promocode, $lines, Auth::user());

        return response()->json(array_merge($result, [
            'code' => $result['valid'] ? $promocode->code : null,
        ]));
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
        $this->authorizeCartItem($cartItem);

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
        $this->authorizeCartItem($cartItem);

        $cartItem->delete();

        return redirect()->back()->with('success', 'Товар удален из корзины!');
    }
}
