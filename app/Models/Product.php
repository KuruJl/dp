<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'manufacturer_id',
        'name',
        'slug',
        'description',
        'price',
        'quantity',
        'status',
        'rejection_reason'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
    public function manufacturer()
    {
        return $this->belongsTo(Manufacturer::class);
    }
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function attributes()
    {
        return $this->belongsToMany(Attribute::class)->withPivot('value');
    }

    
    public function getSpec($attributeName)
    {
        
        $attributesRelation = $this->relationLoaded('attributes')
            ? $this->getRelation('attributes')
            : $this->attributes()->get();

        $attribute = $attributesRelation->where('name', $attributeName)->first();
        return $attribute ? $attribute->pivot->value : null;
    }

    public function getAverageRatingAttribute()
    {
        return $this->reviews()->where('is_approved', true)->avg('rating') ?? 0;
    }
    public function getNameAttribute($value)
    {
        return preg_replace('/\s*\[[^\]]+\]\s*$/', '', $value);
    }
}
