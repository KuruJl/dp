<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promocode extends Model
{
    protected $fillable = [
        'code',
        'is_active',
        'type',
        'value',
        'min_order_amount',
        'usage_limit',
        'used_count',
        'valid_until',
        'category_id',
        'restricted_user_id',
        'first_order_only',
        'admin_only',
    ];

    protected $casts = [
        'valid_until' => 'datetime',
        'value' => 'float',
        'min_order_amount' => 'float',
        'is_active' => 'bool',
        'first_order_only' => 'bool',
        'admin_only' => 'bool',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function restrictedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restricted_user_id');
    }

    public function isValid()
    {
        if (!$this->is_active) {
            return false;
        }
        if ($this->valid_until && $this->valid_until->isPast()) {
            return false;
        }
        if ($this->usage_limit && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }
}