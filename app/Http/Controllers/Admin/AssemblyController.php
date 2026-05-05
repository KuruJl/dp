<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assembly;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AssemblyController extends Controller
{
    /**
     * Получить список всех сборок для админки.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Assembly::query()->with('user:id,name');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }
        
        $assemblies = $query->withCount(['likers', 'comments'])->latest()->paginate(15);

        return response()->json($assemblies);
    }


     // Получить полную информацию о конкретной сборке для админа.

    public function show(Assembly $assembly): JsonResponse
    {
        $assembly->load(['user', 'components.category', 'components.manufacturer']);
        
        return response()->json($assembly);
    }

    
 //Изменить статус публикации сборки.
     
    public function togglePublication(Assembly $assembly): JsonResponse
    {
        $assembly->is_public = !$assembly->is_public;
        $assembly->save();

        $message = $assembly->is_public ? 'Сборка успешно опубликована.' : 'Сборка снята с публикации.';

        return response()->json(['message' => $message]);
    }

    
     // Удалить любую сборку.
    
    public function destroy(Assembly $assembly): JsonResponse
    {
        $assembly->delete();

        return response()->json(['message' => 'Сборка успешно удалена.']);
    }
}