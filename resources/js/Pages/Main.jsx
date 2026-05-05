import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function Main({ tabProducts, hitProducts, categories }) {
    // Состояние для вкладок категорий
    const [activeTab, setActiveTab] = useState('Все категории');
    const [toast, setToast] = useState({ visible: false, message: '', tone: 'info' });
    const bannerSlides = useState(() => Array.from({ length: 5 }, () => '/images/banner.png'))[0];
    const [bannerIdx, setBannerIdx] = useState(0);

    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val);

    const showToast = (message, tone = 'info') => {
        setToast({ visible: true, message, tone });
        setTimeout(() => setToast({ visible: false, message: '', tone }), 1800);
    };

    const addToCart = (productId) => {
        router.post('/cart', { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            preserveState: true,
            only: ['auth'],
            onSuccess: () => showToast('Товар добавлен в корзину', 'info'),
            onError: () => showToast('Не удалось добавить товар', 'error'),
        });
    };

    const prevBanner = () =>
        setBannerIdx((i) => (i - 1 + bannerSlides.length) % bannerSlides.length);
    const nextBanner = () =>
        setBannerIdx((i) => (i + 1) % bannerSlides.length);

    React.useEffect(() => {
        const t = setInterval(() => {
            setBannerIdx((i) => (i + 1) % bannerSlides.length);
        }, 4500);
        return () => clearInterval(t);
    }, [bannerSlides.length]);

    // Компонент карточки товара (Внутри него работает логика Избранного)
    const ProductCard = ({ product }) => {
        const { auth } = usePage().props;
        const isFavorite = auth?.favorites?.includes(product.id);

        const toggleFavorite = (e) => {
            e.preventDefault(); 
            if (!auth?.user) {
                showToast('Войдите в аккаунт, чтобы добавлять в избранное', 'error');
                return;
            }
            const wasFavorite = isFavorite;
            router.post(`/favorites/${product.id}`, {}, {
                preserveScroll: true,
                preserveState: true,
                only: ['auth'],
                onSuccess: () => {
                    showToast(
                        wasFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
                        wasFavorite ? 'info' : 'favorite'
                    );
                },
                onError: () => showToast('Не удалось обновить избранное', 'error'),
            });
        };

        return (
            <div className="bg-white rounded-xl p-5 flex flex-col border border-gray-400 hover:shadow-lg transition-all duration-300 group h-full font-man">
                
                {/* Картинка товара */}
                <Link href={`/products/${product.slug || product.id}`} className="flex-1 flex flex-col">
                    <div className="h-40 w-full mb-4 flex items-center justify-center overflow-hidden">
                        <img 
                            src={product.image_url || '/images/default_product.png'} 
                            alt={product.name} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" 
                        />
                    </div>
                    
                    {/* Название */}
                    <h3 className="text-[15px] font-medium text-black leading-snug mb-4 line-clamp-2 min-h-[40px] flex items-center">
                        {product.name}
                    </h3>
                </Link>
                
                <div className="mt-auto">
                    {/* Цена и Сердечко */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold text-black">
                            {formatPrice(product.price)} ₽
                        </span>
                        
                        {/* Иконка сердечка */}
                        <button 
                            onClick={toggleFavorite}
                            className={`hover:scale-110 transition-all ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                            aria-pressed={isFavorite ? 'true' : 'false'}
                        >
                            <svg className="w-7 h-7" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isFavorite ? 0 : 1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                            </svg>
                        </button>
                    </div>
                    
                    {/* Кнопка "Добавить в корзину" */}
                    <button 
                        onClick={() => addToCart(product.id)} 
                        className="w-full bg-[#08004E] text-white font-medium py-2.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all"
                    >
                        Добавить в корзину
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Главная страница" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div
                    className={`fixed right-6 top-24 z-50 transition-all duration-300 ${
                        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                    }`}
                >
                    <div
                        className={`text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 ${
                            toast.tone === 'favorite'
                                ? 'bg-red-500'
                                : toast.tone === 'error'
                                ? 'bg-rose-700'
                                : 'bg-[#08004E]'
                        }`}
                    >
                        {toast.tone === 'favorite' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        )}
                        {toast.message}
                    </div>
                </div>
                
                {/* 1. БАННЕРЫ */}
                <section className="flex flex-col lg:flex-row gap-6 mb-16">
                    <div className="relative w-full lg:w-2/3 h-[300px] sm:h-[400px] rounded-2xl overflow-hidden bg-gray-300 shadow-sm group">
                        <img 
                            src={bannerSlides[bannerIdx]} 
                            alt="Главный баннер" 
                            onError={(e) => { e.target.onerror = null; e.target.src = '/images/default_product.png'; }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                        />
                        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2">
                            <button type="button" onClick={prevBanner} className="hover:text-pink-200 transition">&lt;</button>
                            <span>{bannerIdx + 1} / {bannerSlides.length}</span>
                            <button type="button" onClick={nextBanner} className="hover:text-pink-200 transition">&gt;</button>
                        </div>
                    </div>

                    <Link 
                        href="/configurator" 
                        className="relative w-full lg:w-1/3 h-[300px] sm:h-[400px] rounded-2xl bg-[#08004E] p-8 sm:p-10 flex flex-col justify-center overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-snug relative z-10">
                            Собери<br/>компьютер с<br/>проверкой<br/>комплектующих
                        </h2>
                        <div className="absolute bottom-8 right-8 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </div>
                    </Link>
                </section>

                {/* 2. КАТЕГОРИИ */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-black mb-6">Категории</h2>
                    
                    {/* Горизонтальное меню табов */}
                    <div className="flex overflow-x-auto gap-6 mb-8 pb-2 scrollbar-hide">
                        <button 
                            onClick={() => setActiveTab('Все категории')}
                            className={`whitespace-nowrap text-sm font-bold transition ${activeTab === 'Все категории' ? 'text-[#08004E] border-b-2 border-[#08004E] pb-1' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Все категории
                        </button>
                        
                        {[
                            'Процессоры', 
                            'Видеокарты', 
                            'Материнские платы', 
                            'Оперативная память', 
                            'Жесткий диск', 
                            'SATA SSD', 
                            'Блоки питания', 
                            'Мониторы', 
                            'Мыши'
                        ].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap text-sm font-bold transition ${activeTab === tab ? 'text-[#08004E] border-b-2 border-[#08004E] pb-1' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Сетка товаров категории */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {tabProducts
                            ?.filter(product => activeTab === 'Все категории' || product.category?.name === activeTab)
                            .slice(0, 5) 
                            .map(product => <ProductCard key={`cat-${product.id}`} product={product} />)
                        }
                    </div>
                </section>

                {/* 3. ПОЛЕЗНЫЕ СТРАНИЦЫ */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-black mb-6">Полезные страницы</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/faq" className="bg-[#08004E] rounded-2xl h-40 flex items-center justify-center hover:scale-[1.02] transition-transform shadow-md">
                            <span className="text-white text-4xl font-extrabold uppercase tracking-wide">FAQ</span>
                        </Link>
                        <Link href="/configurator" className="bg-[#08004E] rounded-2xl h-40 flex items-center justify-center hover:scale-[1.02] transition-transform shadow-md">
                            <span className="text-white text-3xl font-extrabold uppercase tracking-wide">КОНФИГУРАТОР</span>
                        </Link>
                        <Link href="/warranty" className="bg-[#08004E] rounded-2xl h-40 flex items-center justify-center text-center p-4 hover:scale-[1.02] transition-transform shadow-md">
                            <span className="text-white text-3xl font-extrabold uppercase tracking-wide leading-tight">ГАРАНТИЯ<br/>И ВОЗВРАТ</span>
                        </Link>
                    </div>
                </section>

                {/* 4. ХИТЫ ПРОДАЖ */}
                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-black mb-6">Хиты продаж</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {hitProducts?.map(product => <ProductCard key={`hit-${product.id}`} product={product} />)}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}