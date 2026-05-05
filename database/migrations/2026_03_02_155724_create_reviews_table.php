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
    Schema::create('reviews', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Автор отзыва
        $table->foreignId('product_id')->constrained()->cascadeOnDelete(); // На какой товар
        
        $table->tinyInteger('rating')->unsigned(); // Оценка 1-5 (Пункт 3.6.1)
        $table->text('body'); // Текст отзыва
        
        // Статус для модерации (Пункт 3.6.5)
        $table->boolean('is_approved')->default(false); // Пока админ не одобрит - не показываем
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
