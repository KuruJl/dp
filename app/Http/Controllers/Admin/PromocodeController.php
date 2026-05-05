<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promocode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class PromocodeController extends Controller
{
    public function page()
    {
        return Inertia::render('Admin/Promocodes/Index');
    }

    public function list(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('search', ''));

        $query = Promocode::query()->orderByDesc('id');

        if ($q !== '') {
            $query->where('code', 'like', "%{$q}%");
        }

        $p = $query->paginate(15);

        return response()->json([
            'data' => $p->items(),
            'current_page' => $p->currentPage(),
            'last_page' => $p->lastPage(),
            'path' => $p->path(),
            'per_page' => $p->perPage(),
            'total' => $p->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64', 'unique:promocodes,code'],
            'type' => ['required', 'in:percent,fixed'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'valid_until' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $promo = Promocode::create([
            'code' => $data['code'],
            'type' => $data['type'],
            'value' => $data['value'],
            'min_order_amount' => $data['min_order_amount'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'used_count' => 0,
        ]);

        return response()->json($promo, 201);
    }

    public function toggleActive(Promocode $promocode): JsonResponse
    {
        $promocode->is_active = !$promocode->is_active;
        $promocode->save();

        return response()->json(['ok' => true, 'is_active' => (bool) $promocode->is_active]);
    }

    public function destroy(Promocode $promocode): JsonResponse
    {
        $promocode->delete();
        return response()->json(['ok' => true]);
    }
}

