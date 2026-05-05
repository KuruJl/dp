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
    // Категории (Процессоры, Мыши и т.д.)
    Schema::create('categories', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('slug')->unique();
        $table->timestamps();
    });

    // Производители (Intel, AMD, Razer)
    Schema::create('manufacturers', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('slug')->unique();
        $table->timestamps();
    });

    // Справочник всех характеристик (Сокет, Мощность, DPI)
    Schema::create('attributes', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // Название характеристики
        $table->string('type')->default('string'); // string, integer, boolean (для фильтров)
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('directories_tables');
    }
};
