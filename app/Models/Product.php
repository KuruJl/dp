<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable =[
        'category_id', 'manufacturer_id', 'name', 'slug', 'description', 
        'price', 'quantity', 'status', 'rejection_reason'
    ];

    // --- СВЯЗИ ---
    public function category() { return $this->belongsTo(Category::class); }
    public function manufacturer() { return $this->belongsTo(Manufacturer::class); }
    public function images() { return $this->hasMany(ProductImage::class); }
    public function reviews() { return $this->hasMany(Review::class); }

    // Главная связь EAV (Характеристики)
    public function attributes()
    {
        return $this->belongsToMany(Attribute::class)->withPivot('value');
    }

    // --- ХЕЛПЕРЫ (Магия для диплома) ---

    // 1. Получить конкретную характеристику (например, $product->getSpec('Сокет'))
    public function getSpec($attributeName)
    {
        // Важно: $this->attributes внутри модели — это служебный массив полей Eloquent,
        // а не relation attributes(). Поэтому берем relation явно.
        $attributesRelation = $this->relationLoaded('attributes')
            ? $this->getRelation('attributes')
            : $this->attributes()->get();

        $attribute = $attributesRelation->where('name', $attributeName)->first();
        return $attribute ? $attribute->pivot->value : null;
    }

    // 2. Расчет среднего рейтинга (для пункта 3.6.3 "Отображение среднего рейтинга")
    public function getAverageRatingAttribute()
    {
        return $this->reviews()->where('is_approved', true)->avg('rating') ?? 0;
    }
     public function getNameAttribute($value)
    {
        // Регулярное выражение ищет ПОСЛЕДНИЕ скобки [...] в конце строки и удаляет их
        return preg_replace('/\s*\[[^\]]+\]\s*$/', '', $value);
    }
}