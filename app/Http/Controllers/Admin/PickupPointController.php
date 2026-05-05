<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PickupPoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PickupPointController extends Controller
{
    public function page()
    {
        return Inertia::render('Admin/PickupPoints/Index');
    }

    public function list(Request $request)
    {
        $query = PickupPoint::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('city', 'like', '%'.$search.'%')
                  ->orWhere('address', 'like', '%'.$search.'%')
                  ->orWhere('name', 'like', '%'.$search.'%');
            });
        }

        if ($request->filled('city')) {
            $query->where('city', $request->query('city'));
        }

        return response()->json(
            $query->orderBy('city')->orderBy('address')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'city' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:100'],
            'working_hours' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['boolean'],
        ]);

        $point = PickupPoint::create($validated);

        return response()->json([
            'message' => 'Пункт выдачи создан',
            'pickup_point' => $point,
        ]);
    }

    public function update(Request $request, PickupPoint $pickup_point)
    {
        $validated = $request->validate([
            'city' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:100'],
            'working_hours' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['boolean'],
        ]);

        $pickup_point->update($validated);

        return response()->json([
            'message' => 'Пункт выдачи обновлён',
            'pickup_point' => $pickup_point,
        ]);
    }

    public function toggleActive(PickupPoint $pickup_point)
    {
        $pickup_point->is_active = !$pickup_point->is_active;
        $pickup_point->save();

        return response()->json([
            'message' => $pickup_point->is_active ? 'Пункт активирован' : 'Пункт деактивирован',
            'pickup_point' => $pickup_point,
        ]);
    }

    public function destroy(PickupPoint $pickup_point)
    {
        $pickup_point->delete();
        return response()->json(['message' => 'Пункт удалён']);
    }
}
