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
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->foreignId('category_id')->constrained()->cascadeOnDelete();
        $table->foreignId('manufacturer_id')->nullable()->constrained()->nullOnDelete();
        $table->string('name');
        $table->string('slug')->unique();
        $table->text('description')->nullable();
        $table->decimal('price', 10, 2)->unsigned();
        $table->integer('quantity')->unsigned()->default(0); // Остаток на складе
        $table->enum('status', ['на модерации', 'активен', 'отклонен'])->default('на модерации');
        $table->text('rejection_reason')->nullable(); 
        $table->timestamps();
    });

    // Галерея картинок товара
    Schema::create('product_images', function (Blueprint $table) {
        $table->id();
        $table->foreignId('product_id')->constrained()->cascadeOnDelete();
        $table->string('path'); // Путь к картинке
        $table->boolean('is_main')->default(false); // Главная картинка или нет
        $table->timestamps();
    });

}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
    }
};
