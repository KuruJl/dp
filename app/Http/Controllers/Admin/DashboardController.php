<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assembly;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        $stats = [
            'users_count' => User::count(),
            'assemblies_count' => Assembly::count(),
            'public_assemblies_count' => Assembly::where('is_public', true)->count(),
        ];

        return response()->json($stats);
    }
}