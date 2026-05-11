<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Promocode;
use App\Services\PromocodeApplicator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $isPickup = $request->input('delivery_method') === 'Пункт выдачи';

        $validated = $request->validate([
            'city' => [$isPickup ? 'nullable' : 'required', 'string', 'max:120'],
            'address_street' => [$isPickup ? 'nullable' : 'required', 'string', 'max:255'],
            'address_entrance' => ['nullable', 'string', 'max:50'],
            'address_floor' => ['nullable', 'string', 'max:50'],
            'address_apartment' => ['nullable', 'string', 'max:50'],
            'pickup_point_id' => [$isPickup ? 'required' : 'nullable', 'integer', 'exists:pickup_points,id'],
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'delivery_method' => ['required', 'string', 'max:100'],
            'payment_method' => ['required', 'string', 'max:100'],
            'promo_code' => ['nullable', 'string', 'max:100'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'delivery_time' => ['nullable', 'string', 'max:64'],
            'customer_comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = Auth::user();
        $cart = Cart::with('items')->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Ваша корзина пуста.');
        }

        try {
            $order = DB::transaction(function () use ($cart, $user, $validated) {
                $productIdsInCart = $cart->items->pluck('product_id');
                // Блокируем строки от конкурентных покупок! Гениально.
                $products = Product::whereIn('id', $productIdsInCart)->lockForUpdate()->get()->keyBy('id');
                
                foreach ($cart->items as $cartItem) {
                    $product = $products->get($cartItem->product_id);
                    if (!$product || $product->quantity < $cartItem->quantity) {
                        $productName = $product?->name ?? 'Удаленный товар';
                        $availableQty = $product?->quantity ?? 0;
                        throw new \Exception("Недостаточно товара \"{$productName}\". На складе: {$availableQty}");
                    }
                }

                $deliveryAddress = $validated['delivery_address']
                    ?? trim(implode(', ', array_filter([
                        $validated['city'] ?? null,
                        $validated['address_street'] ?? null,
                        !empty($validated['address_entrance']) ? "Подъезд: {$validated['address_entrance']}" : null,
                        !empty($validated['address_floor']) ? "Этаж: {$validated['address_floor']}" : null,
                        !empty($validated['address_apartment']) ? "Кв: {$validated['address_apartment']}" : null,
                    ])));

                $status = ($validated['payment_method'] ?? '') === 'Онлайн' ? 'ожидает оплаты' : 'новый';
                $orderNumber = 'ORD-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));

                $deliveryAt = null;
                $deliveryRaw = trim((string) ($validated['delivery_time'] ?? ''));
                if ($deliveryRaw !== '') {
                    try {
                        $deliveryAt = Carbon::parse($deliveryRaw);
                    } catch (\Throwable $e) {
                        throw new \Exception('Укажите корректные дату и время доставки.');
                    }
                }

                $customerComment = trim((string) ($validated['customer_comment'] ?? ''));

                $orderCommentParts = array_filter([
                    "Получатель: {$validated['name']}",
                    "Телефон: {$validated['phone']}",
                    "Email: {$validated['email']}",
                    !empty($validated['promo_code']) ? "Промокод: {$validated['promo_code']}" : null,
                    !empty($validated['comment']) ? "Комментарий: {$validated['comment']}" : null,
                    $customerComment !== '' ? "Комментарий покупателя:\n{$customerComment}" : null,
                ]);

                $createdOrder = Order::create([
                    'user_id' => $user->id,
                    'order_number' => $orderNumber,
                    'total_amount' => 0,
                    'status' => $status,
                    'payment_method' => $validated['payment_method'],
                    'delivery_method' => $validated['delivery_method'],
                    'delivery_address' => $deliveryAddress ?: null,
                    'delivery_time' => $deliveryAt,
                    'comment' => implode("\n", $orderCommentParts),
                ]);

                $subtotalAmount = 0;

                foreach ($cart->items as $cartItem) {
                    $product = $products->get($cartItem->product_id);
                    $product->decrement('quantity', $cartItem->quantity);

                    $createdOrder->items()->create([
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'price' => $product->price,
                        'quantity' => $cartItem->quantity,
                    ]);

                    $subtotalAmount += ($product->price * $cartItem->quantity);
                }

                $discountAmount = 0;
                $promocodeId = null;

                $rawPromoCode = strtoupper(trim((string) ($validated['promo_code'] ?? '')));
                if ($rawPromoCode !== '') {
                    $promocode = Promocode::where('code', $rawPromoCode)->lockForUpdate()->first();
                    if (!$promocode) {
                        throw new \Exception('Указанный промокод не существует.');
                    }

                    $orderLines = $cart->items->map(function ($cartItem) use ($products) {
                        return (object) [
                            'quantity' => $cartItem->quantity,
                            'product' => $products->get($cartItem->product_id),
                        ];
                    });

                    $evaluation = PromocodeApplicator::evaluate($promocode, $orderLines, $user);
                    if (!$evaluation['valid']) {
                        throw new \Exception($evaluation['message']);
                    }

                    $discountAmount = $evaluation['discount_amount'];
                    $promocodeId = $promocode->id;
                    $promocode->increment('used_count');
                }

                $createdOrder->update([
                    'promocode_id' => $promocodeId,
                    'discount_amount' => $discountAmount,
                    'total_amount' => max(0, $subtotalAmount - $discountAmount),
                ]);
                return $createdOrder;
            });

            // Очищаем корзину (удаляем все items)
            $cart->items()->delete();

            if (($order->payment_method ?? '') === 'Онлайн') {
                $order->update([
                    'status' => 'оплачен',
                ]);

                return redirect()->to('/profile/orders')->with('success', 'Заказ №' . $order->order_number . ' оплачен.');
            }

            return redirect()->route('cart.index')->with('success', 'Заказ №' . $order->order_number . ' успешно оформлен!');

        } catch (\Exception $e) {
            Log::error('Order creation failed: ' . $e->getMessage());
            return redirect()->route('cart.index')->withErrors(['cart' => $e->getMessage()]);
        }
    }

    public function index()
    {
        // ... Оставил для совместимости, но логика вывода заказов у нас теперь в ProfileController
    }

}