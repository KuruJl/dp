<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Manufacturer;
use Illuminate\Database\Eloquent\Factories\Factory;

class ComponentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'price' => $this->faker->numberBetween(1000, 100000),
            'category_id' => Category::factory(),
            'manufacturer_id' => Manufacturer::factory(),
            'specifications' => json_encode(['spec1' => 'value1']),
        ];
    }
}