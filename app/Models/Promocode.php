<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promocode extends Model
{
    protected $fillable =[
        'code', 'is_active', 'type', 'value', 'min_order_amount', 'usage_limit', 'used_count', 'valid_until'
    ];

    protected $casts = [
        'valid_until' => 'datetime',
        'value' => 'float',
        'min_order_amount' => 'float',
        'is_active' => 'bool',
    ];

    public function orders() { return $this->hasMany(Order::class); }

    // Проверка, действителен ли промокод
    public function isValid()
    {
        if (!$this->is_active) return false;
        if ($this->valid_until && $this->valid_until->isPast()) return false;
        if ($this->usage_limit && $this->used_count >= $this->usage_limit) return false;
        return true;
    }
}