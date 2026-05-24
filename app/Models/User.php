<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Assembly;
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // <-- ДОБАВЬТЕ ЭТУ СТРОКУ
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'provider_name',
        'provider_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
    public function assemblies()
    {
        return $this->hasMany(Assembly::class);
    }
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
    public function cart()
    {
        return $this->hasOne(Cart::class);
    }
    public function favorites()
    {
        return $this->belongsToMany(Product::class, 'favorites');
    }
}
