<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse; // <-- 1. Добавь этот импорт

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse // <-- 2. Замени Response на JsonResponse
    {
        $categories = Category::all();
        return response()->json($categories);
    }
}