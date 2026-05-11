<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Assembly;
use App\Models\Product;
use App\Services\CompatibilityService;
use Illuminate\Support\Facades\Auth;

class AssemblyController extends Controller
{
    public function checkCompatibility(Request $request, CompatibilityService $service)
    {
        $componentIds = $request->input('component_ids', []);

        if (empty($componentIds)) {
            return response()->json([]);
        }

        $components = Product::with(['category', 'attributes'])->whereIn('id', $componentIds)->get();
        $errors = $service->checkAssembly($components);

        if (!empty($errors)) {
            return response()->json([
                'compatible' => false,
                'errors' => $errors,
            ], 422); 
        }

        return response()->json([
            'compatible' => true,
            'message' => 'Совместимо',
        ]);
    }

    public function store(Request $request)
    {
        $assembly = Assembly::create([
            'user_id' => Auth::id(),
            'name' => $request->input('name', 'Новая сборка')
        ]);

        $assembly->products()->sync($request->input('component_ids',[]));

        return response()->json([
            'message' => 'Сборка успешно сохранена!',
            'name' => $assembly->name,
            'id' => $assembly->id,
        ], 201);
    }

    public function update(Request $request, Assembly $assembly)
    {
        $assembly->update(['name' => $request->input('name')]);
        $assembly->products()->sync($request->input('component_ids', []));

        return response()->json(['message' => 'Сборка обновлена!']);
    }

    public function show(Assembly $assembly)
    {
        $assembly->load('products.category', 'products.images', 'products.attributes');
        
        $assembly->components = $assembly->products->map(function($product) {
            $product->image_url = $product->images->first()?->path;
            if ($product->category) {
                $product->category->type = 'component';
            }
            return $product;
        });

        $assembly->makeHidden('products');

        return response()->json($assembly);
    }
}