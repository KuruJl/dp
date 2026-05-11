<?php

namespace Database\Seeders;

use App\Models\Assembly;
use App\Models\Attribute;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Promocode;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Используем кросс-БД способ отключения проверок FK.
        Schema::disableForeignKeyConstraints();

        // Транкируем в порядке от "детей" к "родителям".
        DB::table('assembly_product')->truncate();
        Assembly::truncate();
        DB::table('favorites')->truncate();
        Review::truncate();
        OrderItem::truncate();
        Order::truncate();
        CartItem::truncate();
        Cart::truncate();
        DB::table('attribute_product')->truncate();
        ProductImage::truncate();
        Product::truncate();
        Attribute::truncate();
        Manufacturer::truncate();
        Category::truncate();
        Promocode::truncate();
        User::truncate();

        Schema::enableForeignKeyConstraints();

        $this->call([
            UserSeeder::class,
            ComponentSeeder::class,
            AssemblySeeder::class,
        ]);
    }
}