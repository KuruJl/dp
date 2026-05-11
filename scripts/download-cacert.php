<?php

/**
 * Скачивает Mozilla CA bundle для Guzzle/Socialite на Windows (cURL error 60).
 * Запуск: php scripts/download-cacert.php
 */

$url = 'https://curl.se/ca/cacert.pem';
$dir = dirname(__DIR__).'/storage/certs';
$target = $dir.'/cacert.pem';

if (! is_dir($dir) && ! mkdir($dir, 0755, true)) {
    fwrite(STDERR, "Не удалось создать каталог: {$dir}\n");
    exit(1);
}

$data = @file_get_contents($url);
if ($data === false || $data === '') {
    fwrite(STDERR, "Не удалось скачать {$url}\n");
    exit(1);
}

file_put_contents($target, $data);
echo 'OK: '.$target.' ('.strlen($data)." байт)\n";
