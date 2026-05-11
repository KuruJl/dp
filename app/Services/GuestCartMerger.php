<?php

namespace App\Services;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;

class GuestCartMerger
{
    public static function mergeIntoUser(Request $request, int $userId): void
    {
        $token = $request->cookie('guest_cart_token');
        if ($token === null || $token === '') {
            return;
        }

        $guestCart = Cart::query()->where('guest_token', $token)->first();
        if (!$guestCart) {
            Cookie::queue(Cookie::forget('guest_cart_token'));

            return;
        }

        DB::transaction(function () use ($guestCart, $userId) {
            $userCart = Cart::firstOrCreate(['user_id' => $userId]);

            foreach ($guestCart->items()->with('product')->get() as $guestItem) {
                $product = $guestItem->product;
                $guestItem->delete();

                if (!$product) {
                    continue;
                }

                $stock = (int) $product->quantity;
                if ($stock < 1) {
                    continue;
                }

                $existing = $userCart->items()->where('product_id', $product->id)->first();
                $combined = ($existing?->quantity ?? 0) + (int) $guestItem->quantity;
                $qty = min($combined, $stock);

                if ($qty < 1) {
                    continue;
                }

                if ($existing) {
                    $existing->update(['quantity' => $qty]);
                } else {
                    $userCart->items()->create([
                        'product_id' => $product->id,
                        'quantity' => $qty,
                    ]);
                }
            }

            $guestCart->delete();
        });

        Cookie::queue(Cookie::forget('guest_cart_token'));
    }
}
