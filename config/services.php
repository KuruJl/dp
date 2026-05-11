<?php

/*
 | SSL для Guzzle (Google/Yandex OAuth): на Windows у PHP часто нет своего CA-архива → cURL error 60.
 | Приоритет: SSL_CAFILE из .env → файл storage/certs/cacert.pem (можно положить свежий с https://curl.se/ca/cacert.pem).
*/
$socialiteGuzzleSsl = [];
$sslCafileEnv = env('SSL_CAFILE');
if ($sslCafileEnv !== null && $sslCafileEnv !== '' && is_readable($sslCafileEnv)) {
    $socialiteGuzzleSsl['verify'] = $sslCafileEnv;
} else {
    $bundledCa = storage_path('certs/cacert.pem');
    if (is_readable($bundledCa)) {
        $socialiteGuzzleSsl['verify'] = $bundledCa;
    }
}

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],
    /*
    | Redirect URI для OAuth должен в точности совпадать с тем, что указано в консолях Google / Яндекс ID,
    | и с тем URL, по которому вы открываете сайт: localhost и 127.0.0.1 для браузера — разные хосты (разные cookie сессии).
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env(
            'GOOGLE_REDIRECT_URI',
            rtrim((string) env('APP_URL', 'http://localhost'), '/').'/auth/google/callback'
        ),
        'guzzle' => $socialiteGuzzleSsl,
    ],

    'yandex' => [
        'client_id' => env('YANDEX_CLIENT_ID'),
        'client_secret' => env('YANDEX_CLIENT_SECRET'),
        'redirect' => env(
            'YANDEX_REDIRECT_URI',
            rtrim((string) env('APP_URL', 'http://localhost'), '/').'/auth/yandex/callback'
        ),
        'guzzle' => $socialiteGuzzleSsl,
    ],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'currency' => env('STRIPE_CURRENCY', 'rub'),
        'mock_autopay' => env('STRIPE_MOCK_AUTOPAY', false),
    ],

];
