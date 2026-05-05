<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable =[
        'user_id', 'order_number', 'total_amount', 'status', 'payment_method',
        'delivery_method', 'delivery_address', 'delivery_time', 'comment', 
        'payment_id', 'promocode_id', 'discount_amount'
    ];

    protected $casts = [
        'delivery_time' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function promocode() { return $this->belongsTo(Promocode::class); }
}