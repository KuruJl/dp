<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['name', 'slug', 'type'];
    public function products() { return $this->hasMany(Product::class); }

    /**
     * Get the components for the category.
     */
    public function components()
    {
        return $this->hasMany(Component::class);
    }
}