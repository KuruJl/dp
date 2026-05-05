<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\HasMany; // Убедитесь, что импорт есть

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Assembly extends Model
{
    protected $fillable =['user_id', 'name', 'description'];

    public function user() { return $this->belongsTo(User::class); }

    // Товары в сборке (обрати внимание на withPivot('quantity'))
    public function products()
    {
        return $this->belongsToMany(Product::class)->withPivot('quantity')->withTimestamps();
    }
}