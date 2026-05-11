<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class ReviewOwnUpdateDeleteTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(): Product
    {
        $category = Category::factory()->create();
        $manufacturer = Manufacturer::factory()->create();

        return Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'name' => 'Товар для отзыва',
            'slug' => 'review-product-' . Str::lower(Str::random(8)),
            'description' => 'Тест',
            'price' => 100,
            'quantity' => 5,
            'status' => 'активен',
        ]);
    }

    #[TestDox('Владелец может обновить свой отзыв')]
    public function test_owner_can_update_own_review(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rating' => 4,
            'body' => 'Начальный текст отзыва достаточной длины.',
            'is_approved' => true,
        ]);

        $response = $this->actingAs($user)->patch(route('reviews.update', $review), [
            'rating' => 5,
            'body' => 'Обновлённый текст отзыва с достаточной длиной.',
        ]);

        $response->assertRedirect(route('profile.reviews'));
        $review->refresh();
        $this->assertSame(5, $review->rating);
        $this->assertStringContainsString('Обновлённый', $review->body);
        $this->assertFalse((bool) $review->is_approved);
    }

    #[TestDox('Чужой пользователь не может изменить отзыв')]
    public function test_other_user_cannot_update_review(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $product = $this->createProduct();
        $review = Review::create([
            'user_id' => $owner->id,
            'product_id' => $product->id,
            'rating' => 4,
            'body' => 'Текст отзыва от владельца.',
            'is_approved' => false,
        ]);

        $this->actingAs($intruder)->patch(route('reviews.update', $review), [
            'rating' => 1,
            'body' => 'Взлом текста отзыва не должен пройти.',
        ])->assertForbidden();
    }

    #[TestDox('Владелец может удалить свой отзыв')]
    public function test_owner_can_delete_own_review(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rating' => 3,
            'body' => 'Отзыв который будет удалён.',
            'is_approved' => true,
        ]);

        $response = $this->actingAs($user)->delete(route('reviews.destroy', $review));

        $response->assertRedirect(route('profile.reviews'));
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    #[TestDox('Чужой пользователь не может удалить отзыв')]
    public function test_other_user_cannot_delete_review(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $product = $this->createProduct();
        $review = Review::create([
            'user_id' => $owner->id,
            'product_id' => $product->id,
            'rating' => 3,
            'body' => 'Чужой отзыв.',
            'is_approved' => false,
        ]);

        $this->actingAs($intruder)->delete(route('reviews.destroy', $review))->assertForbidden();
        $this->assertDatabaseHas('reviews', ['id' => $review->id]);
    }
}
