<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GuestCartMerger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

class SocialiteController extends Controller
{
    /** @var array<int, string> */
    private const ALLOWED_PROVIDERS = ['google', 'yandex'];

    /**
     * Перенаправляет пользователя на страницу аутентификации провайдера.
     */
    public function redirect(string $provider)
    {
        if (! in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            abort(404);
        }

        return Socialite::driver($provider)->redirect();
    }

    /**
     * Получает информацию от провайдера после аутентификации.
     */
    public function callback(Request $request, string $provider)
    {
        if (! in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            abort(404);
        }

        try {
            $socialUser = Socialite::driver($provider)->user();

            // Проверяем, есть ли у пользователя email. Если нет - это ошибка.
            if (empty($socialUser->getEmail())) {
                return redirect('/login')->withErrors(['social' => 'Не удалось получить email от '.$provider.'.']);
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

            Auth::login($user, true);

            $request->session()->regenerate();

            GuestCartMerger::mergeIntoUser($request, (int) $user->id);

            return redirect()->intended('/');
        } catch (InvalidStateException $e) {
            Log::warning('Socialite InvalidState', ['provider' => $provider, 'message' => $e->getMessage()]);

            return redirect('/login')->withErrors([
                'social' => 'Сессия входа не совпала с ответом провайдера. Чаще всего в .env поле APP_URL должно совпадать с адресом в браузере (не смешивайте localhost и 127.0.0.1), а redirect URI в консоли Google / Яндекс — с тем же хостом, что и APP_URL.',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Socialite callback failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'class' => $e::class,
            ]);

            $msg = $e->getMessage();
            $hint = config('app.debug') ? ' ('.$msg.')' : '';

            $sslHint = '';
            if (stripos($msg, 'SSL certificate') !== false || stripos($msg, 'curl error 60') !== false) {
                $sslHint = ' На Windows у PHP часто нет своего CA-архива: выполните «php scripts/download-cacert.php» (файл storage/certs/cacert.pem) или укажите в .env SSL_CAFILE=полный_путь_к_cacert.pem.';
            }

            return redirect('/login')->withErrors([
                'social' => 'Ошибка авторизации через '.$provider.'. Проверьте ключи в .env и redirect URI в консоли провайдера.'.$sslHint.$hint,
            ]);
        }
    }
}