<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\PromocodeController as AdminPromocodeController;
use App\Http\Controllers\Admin\PickupPointController as AdminPickupPointController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\ProfileOrderController;
use App\Http\Controllers\Stripe\StripeReturnController;
use App\Http\Controllers\Stripe\StripeWebhookController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\SocialiteController; 

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/configurator', function (\Illuminate\Http\Request $request) {
    $loadAssemblyId = $request->query('load');
    return Inertia::render('Index', [
        'loadAssemblyId' => $loadAssemblyId ? (int) $loadAssemblyId : null,
    ]);
})->name('configurator');

Route::get('/catalog', function () {
    return Inertia::render('Catalog'); 
})->name('catalog.index');

Route::get('/catalog/search', [\App\Http\Controllers\ProductController::class, 'index'])->name('catalog.search');

Route::get('/products/{slug}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');

Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{cartItem}/remove', [CartController::class, 'remove'])->name('cart.remove');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Dashboard'); })->middleware('verified')->name('dashboard');
    Route::get('/my-assemblies', [ProfileController::class, 'assemblies'])->name('my-assemblies');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',[ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile',[ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/checkout', [OrderController::class, 'store'])->middleware('verified')->name('checkout.store');
    Route::get('/profile/orders', [ProfileController::class, 'orders'])->middleware('verified')->name('profile.orders');
    Route::post('/profile/orders/{order}/cancel', [ProfileOrderController::class, 'cancel'])->middleware('verified')->name('profile.orders.cancel');
    Route::post('/profile/orders/{order}/reorder', [ProfileOrderController::class, 'reorder'])->middleware('verified')->name('profile.orders.reorder');
    Route::get('/profile/reviews', [ProfileController::class, 'reviews'])->name('profile.reviews');
    Route::post('/products/{product}/reviews', [\App\Http\Controllers\ReviewController::class, 'store'])->name('reviews.store');
    Route::patch('/reviews/{review}', [\App\Http\Controllers\ReviewController::class, 'update'])->name('reviews.update');
    Route::delete('/reviews/{review}', [\App\Http\Controllers\ReviewController::class, 'destroy'])->name('reviews.destroy');

    Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites.index');
    Route::post('/favorites/{product}', [FavoriteController::class, 'toggle'])->name('favorites.toggle');

});

Route::get('/auth/{provider}/redirect', [SocialiteController::class, 'redirect'])
    ->whereIn('provider', ['google', 'yandex'])
    ->name('socialite.redirect');
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'callback'])
    ->whereIn('provider', ['google', 'yandex'])
    ->name('socialite.callback');

Route::get('/stripe/success', [StripeReturnController::class, 'success'])->middleware('auth')->name('stripe.success');
Route::get('/stripe/cancel', [StripeReturnController::class, 'cancel'])->middleware('auth')->name('stripe.cancel');

Route::prefix('api')->group(function () {
    Route::get('/filters/{categorySlug}', [\App\Http\Controllers\FilterController::class, 'getFiltersForCategory']);
    Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
    
    Route::get('/components',[\App\Http\Controllers\ProductController::class, 'apiIndex']);
    Route::get('/components/{product}', [\App\Http\Controllers\ProductController::class, 'apiShow']); 
    
    Route::post('/assemblies/check-compatibility', [\App\Http\Controllers\AssemblyController::class, 'checkCompatibility']);
    Route::post('/cart/promocode-preview', [CartController::class, 'previewPromocode']);
    Route::get('/pickup-points', [\App\Http\Controllers\PickupPointController::class, 'index']);
    Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])->name('stripe.webhook');
});

Route::prefix('api')->middleware('auth')->group(function () {
    Route::get('/assemblies', [\App\Http\Controllers\AssemblyController::class, 'index']);
    Route::get('/assemblies/{assembly}', [\App\Http\Controllers\AssemblyController::class, 'show']);
    Route::post('/assemblies', [\App\Http\Controllers\AssemblyController::class, 'store']);
    Route::patch('/assemblies/{assembly}', [\App\Http\Controllers\AssemblyController::class, 'update']);
    Route::delete('/assemblies/{assembly}', [\App\Http\Controllers\AssemblyController::class, 'destroy']);
});

require __DIR__.'/auth.php';

// --- ADMIN PANEL ---
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

    Route::get('/users', [AdminUserController::class, 'page'])->name('admin.users.index');
    Route::get('/orders', [AdminOrderController::class, 'page'])->name('admin.orders.index');
    Route::get('/categories', [AdminCategoryController::class, 'page'])->name('admin.categories.index');
    Route::get('/reviews', [AdminReviewController::class, 'page'])->name('admin.reviews.index');
    Route::get('/products', [AdminProductController::class, 'page'])->name('admin.products.index');
    Route::get('/promocodes', [AdminPromocodeController::class, 'page'])->name('admin.promocodes.index');
    Route::get('/pickup-points', [AdminPickupPointController::class, 'page'])->name('admin.pickup-points.index');
    Route::get('/reports', [AdminReportController::class, 'page'])->name('admin.reports.index');
});

Route::prefix('api/admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'getStats']);

    Route::get('/users', [AdminUserController::class, 'list']);
    Route::patch('/users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin']);
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

    Route::get('/orders', [AdminOrderController::class, 'list']);
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::get('/categories', [AdminCategoryController::class, 'list']);
    Route::post('/categories', [AdminCategoryController::class, 'store']);
    Route::patch('/categories/{category}', [AdminCategoryController::class, 'update']);
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

    Route::get('/reviews', [AdminReviewController::class, 'list']);
    Route::patch('/reviews/{review}/toggle-approve', [AdminReviewController::class, 'toggleApprove']);
    Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy']);

    Route::get('/products', [AdminProductController::class, 'list']);
    Route::patch('/products/{product}/status', [AdminProductController::class, 'updateStatus']);

    Route::get('/promocodes', [AdminPromocodeController::class, 'list']);
    Route::post('/promocodes', [AdminPromocodeController::class, 'store']);
    Route::patch('/promocodes/{promocode}/toggle-active', [AdminPromocodeController::class, 'toggleActive']);
    Route::delete('/promocodes/{promocode}', [AdminPromocodeController::class, 'destroy']);

    Route::get('/pickup-points', [AdminPickupPointController::class, 'list']);
    Route::post('/pickup-points', [AdminPickupPointController::class, 'store']);
    Route::patch('/pickup-points/{pickup_point}', [AdminPickupPointController::class, 'update']);
    Route::patch('/pickup-points/{pickup_point}/toggle-active', [AdminPickupPointController::class, 'toggleActive']);
    Route::delete('/pickup-points/{pickup_point}', [AdminPickupPointController::class, 'destroy']);

    Route::get('/reports/export/{type}', [AdminReportController::class, 'export'])
        ->where('type', 'sales|popular-products|user-activity');

    Route::get('/products/form-meta', [AdminProductController::class, 'formMeta']);
    Route::get('/products/{product}', [AdminProductController::class, 'show']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::put('/products/{product}', [AdminProductController::class, 'update']);
    Route::patch('/products/{product}', [AdminProductController::class, 'update']);
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);
});