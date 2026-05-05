<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    // Промокоды (Раздел 3.10)
    Schema::create('promocodes', function (Blueprint $table) {
        $table->id();
        $table->string('code')->unique(); // Сам код (например, "SUMMER2024")
        $table->enum('type', ['percent', 'fixed']); // Процентная или фиксированная скидка
        $table->decimal('value', 10, 2); // Размер скидки (например, 10% или 500 руб)
        $table->decimal('min_order_amount', 10, 2)->default(0); // Минимальная сумма заказа
        $table->integer('usage_limit')->nullable(); // Лимит использований всего
        $table->integer('used_count')->default(0); // Сколько раз уже применили
        $table->timestamp('valid_until')->nullable(); // Срок действия акции
        $table->timestamps();
    });

    // Заказы (Раздел 3.3 и 3.4)
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
        $table->string('order_number')->unique(); // Красивый номер заказа (напр. ORD-10293)
        $table->decimal('total_amount', 10, 2); // Итоговая сумма к оплате
        
        // Статус заказа
        $table->enum('status',[
            'новый', 'ожидает оплаты', 'оплачен', 'в доставке', 'выполнен', 'отменен'
        ])->default('новый');
        
        // Доставка и оплата (Пункт 3.3.1 и 3.3.2)
        $table->string('payment_method'); // Способ оплаты (карта, при получении)
        $table->string('delivery_method'); // Способ доставки (курьер, самовывоз)
        $table->string('delivery_address')->nullable(); // Адрес
        $table->dateTime('delivery_time')->nullable(); // Желаемое время
        $table->text('comment')->nullable(); // Комментарий к заказу
        
        // Интеграция оплаты (Пункт 3.4.1)
        $table->string('payment_id')->nullable(); // ID транзакции (из ЮKassa/Robokassa)
        
        // Примененный промокод (Пункт 3.10.3)
        $table->foreignId('promocode_id')->nullable()->constrained()->nullOnDelete();
        $table->decimal('discount_amount', 10, 2)->default(0); // Сумма скидки
        
        $table->timestamps();
    });

    // Товары в заказе (Слепок цен!)
    Schema::create('order_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('order_id')->constrained()->cascadeOnDelete();
        // Если товар удалят из магазина, в истории заказов он должен остаться!
        $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete(); 
        
        // Делаем "слепок" данных на момент покупки (если цена потом изменится, в чеке останется старая)
        $table->string('product_name'); 
        $table->decimal('price', 10, 2); // Цена за 1 шт на момент покупки
        $table->integer('quantity')->unsigned(); // Количество
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders_tables');
    }
};
