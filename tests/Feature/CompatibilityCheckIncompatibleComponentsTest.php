<?php

namespace Tests\Feature;

use App\Models\Attribute;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class CompatibilityCheckIncompatibleComponentsTest extends TestCase
{
    use RefreshDatabase;

    private function createProductWithSocket(Category $category, Manufacturer $manufacturer, string $name, string $socket): Product
    {
        $product = Product::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(6),
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'price' => 15000,
            'quantity' => 10,
            'status' => 'активен',
        ]);

        $socketAttribute = Attribute::firstOrCreate(
            ['name' => 'Сокет'],
            ['type' => 'string']
        );

        $product->attributes()->attach($socketAttribute->id, ['value' => $socket]);

        return $product;
    }

    #[TestDox('Несовместимые компоненты не проходят проверку')]
    public function test_incompatible_components_fail_check(): void
    {
        $cpuCategory = Category::factory()->create(['slug' => 'processory']);
        $mbCategory = Category::factory()->create(['slug' => 'materinskie-platy']);
        $manufacturer = Manufacturer::factory()->create();

        $cpu = $this->createProductWithSocket($cpuCategory, $manufacturer, 'CPU LGA 1700', 'LGA 1700');
        $motherboard = $this->createProductWithSocket($mbCategory, $manufacturer, 'MB AM5', 'AM5');

        $response = $this->postJson('/api/assemblies/check-compatibility', [
            'component_ids' => [$cpu->id, $motherboard->id],
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['compatible', 'errors']);
        $response->assertJsonFragment(['compatible' => false]);
    }
}
