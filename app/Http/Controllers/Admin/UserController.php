<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('Admin/Users/Index');
    }

    /**
     * Получить список всех пользователей с пагинацией.
     */
    public function list(Request $request): JsonResponse
    {
        // Добавим простой поиск по имени или email
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }
        
        $users = $query->latest()->paginate(15);

        return response()->json($users);
    }

    /**
     * Сделать пользователя админом / разжаловать.
     */
    public function toggleAdmin(User $user): JsonResponse
    {
        // Защита от снятия прав с самого себя
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Вы не можете изменить свою собственную роль.'], 403);
        }

        $user->is_admin = !$user->is_admin;
        $user->save();

        return response()->json(['message' => 'Роль пользователя успешно изменена.']);
    }

    /**
     * Удалить (заблокировать) пользователя.
     */
    public function destroy(User $user): JsonResponse
    {
        // Защита от удаления самого себя
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Вы не можете удалить свой собственный аккаунт.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Пользователь успешно удален.']);
    }
}