<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Promocode;
use App\Models\User;

class PromocodeApplicator
{
    /**
     * Сумма корзины по строкам (полная).
     *
     * @param  iterable<int, object|\Illuminate\Database\Eloquent\Model>  $lines  элементы с product (или null) и quantity
     */
    public static function cartSubtotal(iterable $lines): float
    {
        $sum = 0;
        foreach ($lines as $line) {
            $p = $line->product ?? null;
            if (!$p) {
                continue;
            }
            $qty = (int) ($line->quantity ?? 1);
            $sum += (float) $p->price * $qty;
        }

        return round($sum, 2);
    }

    /**
     * База для скидки: либо вся корзина, либо только товары из выбранной категории.
     */
    public static function eligibleDiscountBase(iterable $lines, ?int $categoryId): float
    {
        if ($categoryId === null) {
            return self::cartSubtotal($lines);
        }

        $sum = 0;
        foreach ($lines as $line) {
            $p = $line->product ?? null;
            if (!$p) {
                continue;
            }
            if ((int) $p->category_id !== (int) $categoryId) {
                continue;
            }
            $qty = (int) ($line->quantity ?? 1);
            $sum += (float) $p->price * $qty;
        }

        return round($sum, 2);
    }

    public static function calculateDiscountAmount(Promocode $promocode, float $discountBase): float
    {
        if ($discountBase <= 0) {
            return 0;
        }

        $discount = $promocode->type === 'percent'
            ? ($discountBase * ((float) $promocode->value / 100))
            : (float) $promocode->value;

        return min($discountBase, round($discount, 2));
    }

    /**
     * @param  iterable<int, object|\Illuminate\Database\Eloquent\Model>  $lines
     * @return array{valid: bool, message: string, discount_amount: float, subtotal: float, eligible_base: float, final_total: float, code?: string}
     */
    public static function evaluate(Promocode $promocode, iterable $lines, ?User $user): array
    {
        $subtotal = self::cartSubtotal($lines);

        $fail = function (string $message) use ($subtotal) {
            return [
                'valid' => false,
                'message' => $message,
                'discount_amount' => 0,
                'subtotal' => $subtotal,
                'eligible_base' => 0,
                'final_total' => $subtotal,
            ];
        };

        if (!$promocode->isValid()) {
            return $fail('Промокод недействителен или срок его действия истёк.');
        }

        if ($promocode->restricted_user_id) {
            if (!$user || (int) $user->id !== (int) $promocode->restricted_user_id) {
                return $fail('Этот промокод привязан к другому аккаунту.');
            }
        }

        if ($promocode->admin_only) {
            if (!$user || !(bool) $user->is_admin) {
                return $fail('Промокод доступен только администраторам.');
            }
        }

        if ($promocode->first_order_only) {
            if (!$user) {
                return $fail('Войдите в аккаунт, чтобы использовать этот промокод.');
            }
            $hasOrders = Order::query()
                ->where('user_id', $user->id)
                ->whereNotIn('status', ['отменен'])
                ->exists();
            if ($hasOrders) {
                return $fail('Этот промокод действует только на первый заказ.');
            }
        }

        $eligibleBase = self::eligibleDiscountBase($lines, $promocode->category_id);

        if ($promocode->category_id && $eligibleBase <= 0) {
            return $fail('В корзине нет товаров из категории, для которой действует промокод.');
        }

        $minOrder = (float) $promocode->min_order_amount;
        if ($subtotal < $minOrder) {
            return $fail("Минимальная сумма заказа для промокода: {$promocode->min_order_amount} ₽.");
        }

        $discount = self::calculateDiscountAmount($promocode, $eligibleBase);
        $final = max(0, round($subtotal - $discount, 2));

        return [
            'valid' => true,
            'message' => $promocode->category_id
                ? 'Промокод применён к товарам выбранной категории.'
                : 'Промокод применён.',
            'discount_amount' => $discount,
            'subtotal' => $subtotal,
            'eligible_base' => $eligibleBase,
            'final_total' => $final,
            'code' => $promocode->code,
        ];
    }
}
