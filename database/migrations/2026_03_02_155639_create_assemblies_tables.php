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
    // Сама сборка (черновик)
    Schema::create('assemblies', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Чья сборка
        $table->string('name')->default('Новая сборка'); // Название (напр. "Игровой ПК 2024")
        $table->text('description')->nullable(); // Заметки пользователя для себя
        $table->timestamps();
    });

    // Товары внутри сборки (Связь Сборка + Товары)
    Schema::create('assembly_product', function (Blueprint $table) {
        $table->id();
        $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
        $table->foreignId('product_id')->constrained()->cascadeOnDelete(); // Процессор, память и т.д.
        $table->integer('quantity')->default(1); // На случай, если нужно 2 плашки оперативки
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assemblies_tables');
    }
};
