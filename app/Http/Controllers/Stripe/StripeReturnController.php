<?php

namespace App\Http\Controllers\Stripe;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StripeReturnController extends Controller
{
    public function success(Request $request)
    {
        $sessionId = (string) $request->query('session_id', '');
        if (!$sessionId) {
            return redirect()->to('/profile/orders')->with('error', 'Не удалось получить данные оплаты.');
        }

        try {
            $stripe = app(StripeService::class);
            $session = $stripe->retrieveCheckoutSession($sessionId);
        } catch (\Throwable $e) {
            return redirect()->to('/profile/orders')->with('error', 'Не удалось проверить статус оплаты.');
        }

        $orderId = $session->metadata->order_id ?? null;
        if ($orderId) {
            $order = Order::find($orderId);
            if ($order && (int) $order->user_id === (int) Auth::id() && (string) $order->status !== 'оплачен') {
                if ((string) ($session->payment_status ?? '') === 'paid') {
                    $order->update([
                        'status' => 'оплачен',
                        'payment_id' => (string) $session->id,
                    ]);
                }
            }
        }

        return redirect()->to('/profile/orders');
    }

    public function cancel(Request $request)
    {
        $sessionId = (string) $request->query('session_id', '');
        if (!$sessionId) {
            return redirect()->to('/cart')->with('error', 'Оплата отменена.');
        }

        try {
            $stripe = app(StripeService::class);
            $session = $stripe->retrieveCheckoutSession($sessionId);
        } catch (\Throwable $e) {
            return redirect()->to('/cart')->with('error', 'Оплата отменена.');
        }

        $orderId = $session->metadata->order_id ?? null;
        if ($orderId) {
            $order = Order::find($orderId);
            if ($order && (int) $order->user_id === (int) Auth::id()) {
                // Если уже оплачено — не отменяем.
                if ((string) $order->status !== 'оплачен') {
                    DB::transaction(function () use ($order, $session) {
                        if ((string) $order->status === 'отменен') return;

                        $orderItems = $order->items()->get();
                        $productIds = $orderItems->pluck('product_id')->filter()->unique()->values();

                        if ($productIds->isNotEmpty()) {
                            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');
                            foreach ($orderItems as $item) {
                                if (!$item->product_id) continue;
                                $product = $products->get($item->product_id);
                                if ($product) {
                                    $product->increment('quantity', (int) $item->quantity);
                                }
                            }
                        }

                        $order->update([
                            'status' => 'отменен',
                            'payment_id' => (string) $session->id,
                        ]);
                    });
                }
            }
        }

        return redirect()->to('/cart')->with('error', 'Оплата отменена.');
    }
}

