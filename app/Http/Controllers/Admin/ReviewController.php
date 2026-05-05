<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('Admin/Reviews/Index');
    }

    public function list(Request $request): JsonResponse
    {
        $query = Review::query()->with(['user:id,name,email', 'product:id,name,slug'])->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('body', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('product', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $isApproved = $request->query('status') === 'approved';
            $query->where('is_approved', $isApproved);
        }

        return response()->json($query->paginate(15));
    }

    public function toggleApprove(Review $review): JsonResponse
    {
        $review->is_approved = !$review->is_approved;
        $review->save();

        return response()->json(['message' => 'Статус отзыва обновлен.']);
    }

    public function destroy(Review $review): JsonResponse
    {
        $review->delete();
        return response()->json(['message' => 'Отзыв удален.']);
    }
}
