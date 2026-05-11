<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\User;
use App\Services\GuestCartMerger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class GuestCartMergeTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(int $stock = 10): Product
    {
        $category = Category::factory()->create();
        $manufacturer = Manufacturer::factory()->create();

        return Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'name' => 'Товар для корзины',
            'slug' => 'cart-product-' . Str::lower(Str::random(8)),
            'description' => 'Тест',
            'price' => 500,
            'quantity' => $stock,
            'status' => 'активен',
        ]);
    }

    #[TestDox('Гостевая корзина переносится в корзину пользователя при слиянии')]
    public function test_guest_cart_items_merge_into_user_cart(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(10);
        $token = (string) Str::uuid();

        $guestCart = Cart::create(['guest_token' => $token]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $request = Request::create('/');
        $request->cookies->set('guest_cart_token', $token);

        GuestCartMerger::mergeIntoUser($request, $user->id);

        $this->assertDatabaseMissing('carts', ['id' => $guestCart->id]);

        $userCart = Cart::where('user_id', $user->id)->first();
        $this->assertNotNull($userCart);
        $item = $userCart->items()->where('product_id', $product->id)->first();
        $this->assertNotNull($item);
        $this->assertSame(3, $item->quantity);
    }

    #[TestDox('Одинаковые товары суммируются с ограничением по остатку')]
    public function test_merge_combines_quantities_capped_by_stock(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(5);
        $token = (string) Str::uuid();

        $guestCart = Cart::create(['guest_token' => $token]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $product->id,
            'quantity' => 4,
        ]);

        $userCart = Cart::firstOrCreate(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $request = Request::create('/');
        $request->cookies->set('guest_cart_token', $token);

        GuestCartMerger::mergeIntoUser($request, $user->id);

        $userCart->refresh();
        $item = $userCart->items()->where('product_id', $product->id)->first();
        $this->assertNotNull($item);
        $this->assertSame(5, $item->quantity);
    }
}
