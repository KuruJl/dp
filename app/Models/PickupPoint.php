<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PickupPoint extends Model
{
    protected $fillable = [
        'city',
        'address',
        'name',
        'working_hours',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'bool',
    ];
}
