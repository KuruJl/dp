<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialiteController extends Controller
{
    /**
     * Перенаправляет пользователя на страницу аутентификации провайдера.
     */
    public function redirect($provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Получает информацию от провайдера после аутентификации.
     */
    public function callback($provider)
{
    try {
        $socialUser = Socialite::driver($provider)->user();

        // Проверяем, есть ли у пользователя email. Если нет - это ошибка.
        if (empty($socialUser->getEmail())) {
            return redirect('/login')->withErrors(['social' => 'Не удалось получить email от ' . $provider . '.']);
        }

        // 1. Ищем пользователя по email, который вернула соцсеть
        $user = User::where('email', $socialUser->getEmail())->first();

        // 2. Если пользователь с таким email уже существует...
        if ($user) {
            // ...но он зарегистрирован не через эту соцсеть,
            // просто обновляем его данные, привязывая аккаунт соцсети.
            $user->update([
                'provider_name' => $provider,
                'provider_id' => $socialUser->getId(),
            ]);
        } 
        // 3. Если пользователя с таким email нет, создаем нового.
        else {
            $user = User::create([
                'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? $socialUser->getEmail(),
                'email' => $socialUser->getEmail(),
                'password' => Hash::make(Str::random(24)),
                'provider_name' => $provider,
                'provider_id' => $socialUser->getId(),
            ]);
        }

        // 4. Авторизуем найденного или созданного пользователя
        Auth::login($user);

        return redirect('/');

    } catch (\Exception $e) {
        // dd($e); // Можно раскомментировать для отладки
        return redirect('/login')->withErrors(['social' => 'Произошла ошибка авторизации. Попробуйте снова.']);
    }
}
}