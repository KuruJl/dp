<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\Product;
use App\Services\CompatibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AssemblyController extends Controller
{
    public function checkCompatibility(Request $request, CompatibilityService $service): JsonResponse
    {
        $validated = $request->validate([
            'component_ids' => ['required', 'array', 'max:32'],
            'component_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ]);

        $componentIds = $validated['component_ids'];

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

    public function index(): JsonResponse
    {
        $assemblies = Assembly::query()
            ->where('user_id', Auth::id())
            ->latest()
            ->get(['id', 'name', 'description', 'created_at', 'updated_at']);

        return response()->json($assemblies);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedAssemblyPayload($request);

        $assembly = Assembly::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
        ]);

        $assembly->products()->sync($validated['component_ids']);

        return response()->json([
            'message' => 'Сборка успешно сохранена!',
            'name' => $assembly->name,
            'id' => $assembly->id,
        ], 201);
    }

    public function update(Request $request, Assembly $assembly): JsonResponse
    {
        $this->authorize('update', $assembly);

        $validated = $this->validatedAssemblyPayload($request);

        $assembly->update(['name' => $validated['name']]);
        $assembly->products()->sync($validated['component_ids']);

        return response()->json(['message' => 'Сборка обновлена!']);
    }

    public function show(Assembly $assembly): JsonResponse
    {
        $this->authorize('view', $assembly);

        $assembly->load('products.category', 'products.images', 'products.attributes');

        $assembly->components = $assembly->products->map(function ($product) {
            $product->image_url = $product->images->first()?->path;
            if ($product->category) {
                $product->category->type = 'component';
            }

            return $product;
        });

        $assembly->makeHidden('products');

        return response()->json($assembly);
    }

    public function destroy(Assembly $assembly): JsonResponse
    {
        $this->authorize('delete', $assembly);

        $assembly->delete();

        return response()->json(['message' => 'Сборка удалена.']);
    }

    /**
     * @return array{name: string, component_ids: array<int, int>}
     */
    private function validatedAssemblyPayload(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'component_ids' => ['nullable', 'array', 'max:32'],
            'component_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ]);

        return [
            'name' => trim((string) ($validated['name'] ?? '')) ?: 'Новая сборка',
            'component_ids' => array_values(array_unique($validated['component_ids'] ?? [])),
        ];
    }
}
