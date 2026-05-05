<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = ['user_id', 'guest_token'];

    public function items() 
    { 
        return $this->hasMany(CartItem::class); 
    }
    
    public function user() 
    { 
        return $this->belongsTo(User::class); 
    }

    // Удобный метод для пересчета суммы корзины (Пункт 3.2.4)
    public function getTotalAmount()
    {
        return $this->items->sum(function($item) {
            return $item->product->price * $item->quantity;
        });
    }
}
