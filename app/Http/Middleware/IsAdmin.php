<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Проверяем, залогинен ли пользователь и является ли он админом
        if (Auth::check() && Auth::user()->is_admin) {
            // Если да, пропускаем запрос дальше
            return $next($request);
        }

        // Если нет, прерываем запрос с ошибкой 403 (Доступ запрещен)
        abort(403, 'Unauthorized action.');
    }
}