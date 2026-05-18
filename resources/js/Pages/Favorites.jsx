import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const normalizeSpecs = (product) => {
    const rawSpecs = product?.specs ?? product?.attributes ?? [];

    if (Array.isArray(rawSpecs)) {
        return rawSpecs
            .map((attr) => {
                if (!attr || typeof attr !== 'object') return null;
                const name = attr.name;
                const value = attr.pivot?.value ?? attr.value ?? null;
                return name && value ? { name, value } : null;
            })
            .filter(Boolean);
    }

    if (rawSpecs && typeof rawSpecs === 'object') {
        return Object.entries(rawSpecs)
            .map(([name, value]) => {
                if (value && typeof value === 'object') {
                    const objectName = value.name ?? name;
                    const objectValue = value.pivot?.value ?? value.value ?? null;
                    return objectName && objectValue ? { name: objectName, value: objectValue } : null;
                }
                return value ? { name, value } : null;
            })
            .filter(Boolean);
    }

    return [];
};

const formatProductSpecs = (product) => {
    const specs = normalizeSpecs(product);

    if (specs.length === 0) {
        return product.description || 'Характеристики отсутствуют в базе';
    }

    const cleanSpecs = specs
        .filter((attr) => {
            const name = attr.name.toLowerCase();
            return (
                !name.includes('гаранти') &&
                !name.includes('стран') &&
                !name.includes('цвет') &&
                !name.includes('модель')
            );
        })
        .slice(0, 5)
        .map((attr) => `${attr.name}: ${attr.value}`);

    return cleanSpecs.length > 0
        ? cleanSpecs.join(' • ')
        : product.description || 'Характеристики отсутствуют';
};

export default function Favorites({ favorites = [] }) {
    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val || 0);
    const [toast, setToast] = useState({ visible: false, message: '', tone: 'info' });

    const showToast = (message, tone = 'info') => {
        setToast({ visible: true, message, tone });
        setTimeout(() => setToast({ visible: false, message: '', tone }), 1800);
    };

    const removeFromFavorites = (productId) => {
        router.post(`/favorites/${productId}`, {}, {
            preserveScroll: true,
            onSuccess: () => showToast('Удалено из избранного', 'info'),
            onError: () => showToast('Не удалось удалить', 'error'),
        });
    };

    const addToCart = (productId) => {
        router.post('/cart', { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => showToast('Товар добавлен в корзину', 'info'),
            onError: () => showToast('Не удалось добавить товар', 'error'),
        });
    };

    const isEmpty = !favorites || favorites.length === 0;

    return (
        <div className="min-h-screen flex flex-col font-man">
            <Head title="Избранное" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <div
                    className={`fixed right-6 top-24 z-50 transition-all duration-300 ${
                        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                    }`}
                >
                    <div
                        className={`text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 ${
                            toast.tone === 'favorite' ? 'bg-red-500' : toast.tone === 'error' ? 'bg-rose-700' : 'bg-[#08004E]'
                        }`}
                    >
                        {toast.message}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4 mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black">Избранное</h1>
                    {!isEmpty && (
                        <span className="text-sm text-gray-500">
                            Товаров: <span className="font-bold text-black">{favorites.length}</span>
                        </span>
                    )}
                </div>

                {isEmpty ? (
                    <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-200">
                        <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                        </svg>
                        <p className="font-bold text-2xl text-black mb-3">В избранном пока пусто</p>
                        <p className="text-gray-500 mb-6">Добавляйте товары в избранное, чтобы быстро возвращаться к ним позже.</p>
                        <Link href="/catalog" className="inline-block bg-[#08004E] text-white font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition">
                            Перейти в каталог
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {favorites.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-shadow duration-300 border border-transparent hover:border-gray-200"
                            >
                                <Link href={`/products/${product.slug || product.id}`} className="w-full md:w-56 h-40 flex-shrink-0 flex items-center justify-center p-2">
                                    <img src={product.image_url || '/images/default_product.png'} alt={product.name} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500" />
                                </Link>

                                <div className="flex-1 w-full">
                                    <Link href={`/products/${product.slug || product.id}`}>
                                        <h3 className="text-lg font-bold text-black leading-snug hover:text-[#08004E] transition-colors">{product.name}</h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2 min-h-[32px]">
                                        {formatProductSpecs(product)}
                                    </p>
                                </div>

                                <div className="w-full md:w-56 flex flex-col items-end gap-4 shrink-0">
                                    <div className="text-2xl font-extrabold text-black whitespace-nowrap">
                                        {formatPrice(product.price)} ₽
                                    </div>

                                    <div className="flex gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={() => removeFromFavorites(product.id)}
                                            className="w-12 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-500 hover:border-red-400 transition-colors"
                                            title="Убрать из избранного"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                                            </svg>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => addToCart(product.id)}
                                            className="flex-1 h-10 bg-[#08004E] text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
                                        >
                                            В корзину
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
