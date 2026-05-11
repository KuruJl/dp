<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('Admin/Products/Index');
    }

    public function formMeta(): JsonResponse
    {
        return response()->json([
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'manufacturers' => Manufacturer::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => ['на модерации', 'активен', 'отклонен'],
        ]);
    }

    public function list(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category:id,name', 'manufacturer:id,name'])->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('manufacturer', function ($mq) use ($search) {
                        $mq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return response()->json($query->paginate(20));
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category:id,name', 'manufacturer:id,name', 'images', 'attributes']);

        $specs = $product->attributes->map(fn ($a) => [
            'name' => $a->name,
            'value' => $a->pivot->value,
        ])->values()->all();

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->getRawOriginal('name'),
                'slug' => $product->slug,
                'description' => $product->description,
                'price' => (float) $product->price,
                'quantity' => (int) $product->quantity,
                'status' => $product->status,
                'rejection_reason' => $product->rejection_reason,
                'category_id' => $product->category_id,
                'manufacturer_id' => $product->manufacturer_id,
                'main_image_url' => optional($product->images->firstWhere('is_main', true))->path
                    ?? $product->images->first()?->path,
                'specs' => $specs,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPayload($request);

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'manufacturer_id' => $validated['manufacturer_id'],
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'quantity' => $validated['quantity'],
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $this->syncSpecs($product, $validated['specs'] ?? []);
        $this->syncMainImage($product, $validated['main_image_url'] ?? null);

        return response()->json(['message' => 'Товар создан.', 'product' => $product->fresh(['category', 'manufacturer'])], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validatedPayload($request, $product->id);

        $product->update([
            'category_id' => $validated['category_id'],
            'manufacturer_id' => $validated['manufacturer_id'],
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'quantity' => $validated['quantity'],
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $this->syncSpecs($product, $validated['specs'] ?? []);
        $this->syncMainImage($product, $validated['main_image_url'] ?? null);

        return response()->json(['message' => 'Товар обновлён.']);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Товар удалён.']);
    }

    public function updateStatus(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:на модерации,активен,отклонен'],
        ]);

        $product->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Статус товара обновлен.']);
    }

    private function validatedPayload(Request $request, ?int $exceptProductId = null): array
    {
        $slugRule = ['required', 'string', 'max:255', 'unique:products,slug'];
        if ($exceptProductId) {
            $slugRule = ['required', 'string', 'max:255', 'unique:products,slug,' . $exceptProductId];
        }

        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'manufacturer_id' => ['nullable', 'integer', 'exists:manufacturers,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => $slugRule,
            'description' => ['nullable', 'string', 'max:65535'],
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'string', 'in:на модерации,активен,отклонен'],
            'rejection_reason' => ['nullable', 'string', 'max:65535'],
            'main_image_url' => ['nullable', 'string', 'max:2048'],
            'specs' => ['nullable', 'array'],
            'specs.*.name' => ['required_with:specs', 'string', 'max:255'],
            'specs.*.value' => ['required_with:specs', 'string', 'max:2000'],
            'new_manufacturer_name' => ['nullable', 'string', 'max:255'],
        ]);

        $newMfr = trim((string) ($validated['new_manufacturer_name'] ?? ''));
        if ($newMfr !== '') {
            $slug = Str::slug($newMfr) ?: 'brand-' . Str::random(6);
            $m = Manufacturer::firstOrCreate(
                ['slug' => $slug],
                ['name' => $newMfr]
            );
            $validated['manufacturer_id'] = $m->id;
        }

        unset($validated['new_manufacturer_name']);

        $validated['slug'] = trim((string) $validated['slug']);
        if ($validated['slug'] === '') {
            $validated['slug'] = Str::slug($validated['name']) ?: 'product-' . Str::random(8);
        }

        return $validated;
    }

    private function syncSpecs(Product $product, array $specs): void
    {
        $sync = [];
        foreach ($specs as $row) {
            $name = trim((string) ($row['name'] ?? ''));
            $value = trim((string) ($row['value'] ?? ''));
            if ($name === '' || $value === '') {
                continue;
            }
            $attr = Attribute::firstOrCreate(['name' => $name], ['type' => 'string']);
            $sync[$attr->id] = ['value' => $value];
        }
        $product->attributes()->sync($sync);
    }

    private function syncMainImage(Product $product, ?string $url): void
    {
        $url = $url !== null ? trim($url) : '';
        if ($url === '') {
            return;
        }

        $existingMain = $product->images()->where('is_main', true)->first();
        if ($existingMain && $existingMain->path === $url) {
            return;
        }

        $product->images()->update(['is_main' => false]);
        ProductImage::create([
            'product_id' => $product->id,
            'path' => $url,
            'is_main' => true,
        ]);
    }
}
