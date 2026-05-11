<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ProfileOrderController extends Controller
{
    private function authorizeOwn(Order $order): void
    {
        abort_if(! auth()->check() || (int) $order->user_id !== (int) auth()->id(), 403);
    }

    /**
     * Отмена заказа до оплаты/отправки с возвратом остатков на склад.
     */
    public function cancel(Order $order): RedirectResponse
    {
        $this->authorizeOwn($order);

        $cancellable = in_array((string) $order->status, ['новый', 'ожидает оплаты'], true);
        if (!$cancellable) {
            return redirect()->route('profile.orders')->with('error', 'Этот заказ нельзя отменить в текущем статусе.');
        }

        try {
            DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::whereKey($item->product_id)->increment('quantity', $item->quantity);
                    }
                }
                $order->update(['status' => 'отменен']);
            });

            return redirect()->route('profile.orders')->with('success', 'Заказ отменён, товары возвращены на склад.');
        } catch (\Throwable $e) {
            return redirect()->route('profile.orders')->with('error', 'Не удалось отменить заказ.');
        }
    }

    /**
     * Добавить позиции заказа в корзину пользователя (активные товары).
     */
    public function reorder(Order $order): RedirectResponse
    {
        $this->authorizeOwn($order);

        if ($order->status === 'отменен') {
            return redirect()->route('profile.orders')->with('error', 'Нельзя повторить отменённый заказ.');
        }

        $cart = Cart::firstOrCreate(['user_id' => auth()->id()]);
        $added = 0;

        foreach ($order->items as $item) {
            if (!$item->product_id) {
                continue;
            }
            $product = Product::query()->whereKey($item->product_id)->first();
            if (!$product || (string) $product->status !== 'активен') {
                continue;
            }

            $wantQty = (int) $item->quantity;
            $existing = $cart->items()->where('product_id', $product->id)->first();
            $inCart = $existing ? (int) $existing->quantity : 0;
            $maxCanAdd = max(0, (int) $product->quantity - $inCart);
            $add = min($wantQty, $maxCanAdd);
            if ($add < 1) {
                continue;
            }

            if ($existing) {
                $existing->update(['quantity' => $inCart + $add]);
            } else {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $add,
                ]);
            }
            $added++;
        }

        if ($added === 0) {
            return redirect()->route('profile.orders')->with('error', 'Не удалось добавить товары: нет на складе или позиции недоступны.');
        }

        return redirect()->route('cart.index')->with('success', 'Товары из заказа добавлены в корзину (с учётом остатков).');
    }
}
