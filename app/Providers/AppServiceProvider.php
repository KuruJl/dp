<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory; // <-- 1. Добавьте этот импорт

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // --- 2. ДОБАВЬТЕ ЭТОТ БЛОК КОДА ---
        $this->bootSocialiteProviders();
    }

    /**
     * Вручную регистрирует сторонние провайдеры для Socialite.
     */
    protected function bootSocialiteProviders(): void
    {
        $socialite = $this->app->make(SocialiteFactory::class);

        $socialite->extend(
            'yandex',
            function ($app) use ($socialite) {
                $config = $app['config']['services.yandex'];
                return $socialite->buildProvider(\SocialiteProviders\Yandex\Provider::class, $config);
            }
        );
    }
}