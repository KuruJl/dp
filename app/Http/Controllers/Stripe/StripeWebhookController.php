<?php

namespace App\Http\Controllers\Stripe;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');
        if (!$secret) {
            return response()->json(['error' => 'Stripe webhook secret not configured'], 500);
        }

        $sig = $request->header('Stripe-Signature');
        $payload = $request->getContent();

        try {
            $event = Webhook::constructEvent(
                $payload,
                (string) $sig,
                $secret
            );
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Webhook signature verification failed'], 400);
        }

        $type = $event->type;
        $object = $event->data->object;

        // В metadata кладём order_id, созданный до Stripe.
        $orderId = $object->metadata->order_id ?? null;
        if (!$orderId) {
            return response()->json(['ok' => true]);
        }

        $order = Order::find($orderId);
        if (!$order) {
            return response()->json(['ok' => true]);
        }

        // Идемпотентность: если уже оплачено — не трогаем.
        if ((string) $order->status === 'оплачен') {
            return response()->json(['ok' => true]);
        }

        if ($type === 'checkout.session.completed') {
            $paymentStatus = (string) ($object->payment_status ?? '');

            if ($paymentStatus === 'paid') {
                $order->update([
                    'status' => 'оплачен',
                    'payment_id' => (string) $object->id,
                ]);
            }

            return response()->json(['ok' => true]);
        }

        if (
            $type === 'checkout.session.async_payment_failed' ||
            $type === 'checkout.session.expired'
        ) {
            // Помечаем заказ как отмененный и возвращаем наличие, если оно еще не возвращалось.
            $this->cancelOrderAndRestoreStock($order, (string) $object->id);
            return response()->json(['ok' => true]);
        }

        return response()->json(['ok' => true]);
    }

    private function cancelOrderAndRestoreStock(Order $order, string $paymentId): void
    {
        DB::transaction(function () use ($order, $paymentId) {
            // Если уже в другом статусе — выходим
            if ((string) $order->status === 'отменен' || (string) $order->status === 'оплачен') {
                return;
            }

            $orderItems = $order->items()->get();
            $productIds = $orderItems->pluck('product_id')->filter()->unique()->values();

            if ($productIds->isNotEmpty()) {
                $products = \App\Models\Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');
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
                'payment_id' => $paymentId,
            ]);
        });
    }
}

