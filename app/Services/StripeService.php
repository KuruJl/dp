<?php

namespace App\Services;

use App\Models\Order;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\StripeClient;

class StripeService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $secret = config('services.stripe.secret');
        $this->stripe = new StripeClient($secret);
    }

    public function createCheckoutSession(Order $order, array $orderItems): CheckoutSession
    {
        $currency = config('services.stripe.currency', 'rub');

        $subtotalCents = 0;
        foreach ($orderItems as $item) {
            $unitCents = (int) round(((float) $item->price) * 100);
            $subtotalCents += $unitCents * (int) $item->quantity;
        }

        $totalCents = (int) round(((float) $order->total_amount) * 100);
        $ratio = $subtotalCents > 0 ? ($totalCents / $subtotalCents) : 1.0;

        // Подготовим unit-цены в cents, чтобы сумма line_items совпадала с total_amount.
        $unitEntries = [];
        foreach ($orderItems as $item) {
            $unitCentsRaw = (int) round(((float) $item->price) * 100);
            for ($i = 0; $i < (int) $item->quantity; $i++) {
                $unitEntries[] = [
                    'name' => (string) $item->product_name,
                    'unitCentsRaw' => $unitCentsRaw,
                ];
            }
        }

        $floorsSum = 0;
        $units = [];
        foreach ($unitEntries as $entry) {
            $cents = (int) floor(((float) $entry['unitCentsRaw']) * $ratio);
            $units[] = [
                'name' => $entry['name'],
                'unitCents' => $cents,
            ];
            $floorsSum += $cents;
        }

        $remainder = $totalCents - $floorsSum;
        // Дадим остаток по 1 центу к первым единицам, чтобы точно совпало.
        $idx = 0;
        while ($remainder > 0 && isset($units[$idx])) {
            $units[$idx]['unitCents'] += 1;
            $remainder -= 1;
            $idx++;
            if ($idx >= count($units)) $idx = 0;
        }

        // Группируем одинаковые (name + unitCents)
        $grouped = [];
        foreach ($units as $u) {
            $key = $u['name'] . '|' . $u['unitCents'];
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'name' => $u['name'],
                    'unitCents' => $u['unitCents'],
                    'quantity' => 0,
                ];
            }
            $grouped[$key]['quantity'] += 1;
        }

        $lineItems = [];
        foreach ($grouped as $g) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => $currency,
                    'unit_amount' => $g['unitCents'],
                    'product_data' => [
                        'name' => $g['name'],
                    ],
                ],
                'quantity' => $g['quantity'],
            ];
        }

        $successUrl = route('stripe.success') . '?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = route('stripe.cancel') . '?session_id={CHECKOUT_SESSION_ID}';

        // Email хранится внутри comment (пока отдельного поля нет).
        $email = null;
        if (!empty($order->comment)) {
            if (preg_match('/Email:\s*(.+)/u', (string) $order->comment, $m)) {
                $email = trim($m[1]);
            }
        }

        return $this->stripe->checkout->sessions->create([
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'customer_email' => $email ?: null,
            'line_items' => $lineItems,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $order->id,
            'metadata' => [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
            ],
        ]);
    }

    public function retrieveCheckoutSession(string $sessionId): CheckoutSession
    {
        return $this->stripe->checkout->sessions->retrieve($sessionId);
    }
}

