<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promocode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
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

        $query = Promocode::query()
            ->with(['category:id,name', 'restrictedUser:id,name,email'])
            ->orderByDesc('id');

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
        if ($request->has('code')) {
            $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);
        }

        $data = $request->validate([
            'code' => ['required', 'string', 'max:64', 'unique:promocodes,code'],
            'type' => ['required', 'in:percent,fixed'],
            'value' => [
                'required',
                'numeric',
                'min:0',
                Rule::when($request->input('type') === 'percent', ['max:100']),
            ],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'valid_until' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'restricted_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'first_order_only' => ['nullable', 'boolean'],
            'admin_only' => ['nullable', 'boolean'],
        ]);

        $promo = Promocode::create([
            'code' => $data['code'],
            'type' => $data['type'],
            'value' => $data['value'],
            'min_order_amount' => $data['min_order_amount'] ?? 0,
            'usage_limit' => $data['usage_limit'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'used_count' => 0,
            'category_id' => $data['category_id'] ?? null,
            'restricted_user_id' => $data['restricted_user_id'] ?? null,
            'first_order_only' => $data['first_order_only'] ?? false,
            'admin_only' => $data['admin_only'] ?? false,
        ]);

        return response()->json($promo->load(['category:id,name', 'restrictedUser:id,name,email']), 201);
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
