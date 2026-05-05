<?php

namespace App\Http\Controllers;

use App\Models\PickupPoint;

class PickupPointController extends Controller
{
    public function index()
    {
        $points = PickupPoint::where('is_active', true)
            ->orderBy('city')
            ->orderBy('address')
            ->get();

        $grouped = $points->groupBy('city')->map(function ($items, $city) {
            return [
                'city' => $city,
                'points' => $items->map(fn($p) => [
                    'id' => $p->id,
                    'address' => $p->address,
                    'name' => $p->name,
                    'working_hours' => $p->working_hours,
                    'phone' => $p->phone,
                ])->values(),
            ];
        })->values();

        return response()->json([
            'points' => $points,
            'cities' => $grouped,
        ]);
    }
}
