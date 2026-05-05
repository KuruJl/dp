import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function ProductPage({ product, relatedProducts }) {
    // Получаем текущего пользователя для отзывов
    const { auth } = usePage().props;
    const user = auth?.user;

    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [mainImage, setMainImage] = useState(product?.image_url || '/images/default_product.png');
    const [showAllSpecs, setShowAllSpecs] = useState(false);

    // Форма для нового отзыва
    const { data: reviewData, setData: setReviewData, post: postReview, processing: reviewProcessing, reset: resetReview, errors: reviewErrors } = useForm({
        rating: 5,
        body: ''
    });

    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val || 0);
    const isInStock = product?.quantity > 0;
  const allowedForConfigurator =[
        'korpusa', 'materinskie-platy', 'processory', 'kulery-dlia-processora',
        'operativnaia-pamiat', 'videokarty', 'm2-ssd-nakopiteli', 'sata-ssd-nakopiteli',
        'zestkii-disk', 'bloki-pitaniia'
    ];
    // Проверяем, разрешен ли этот товар для сборки
    const isConfiguratorItem = product?.category?.slug && allowedForConfigurator.includes(product.category.slug);
    
    const addToCart = () => {
        if (isLoading || !isInStock) return;
        setIsLoading(true);
        router.post('/cart', { product_id: product.id, quantity }, {
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const submitReview = (e) => {
        e.preventDefault();
        postReview(`/products/${product.id}/reviews`, {
            preserveScroll: true,
            onSuccess: () => resetReview(),
        });
    };

    // Вспомогательный компонент "Звездочка"
    const Star = ({ filled, onClick }) => (
        <svg onClick={onClick} className={`w-6 h-6 ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );

    // Компонент карточки для похожих товаров
    const ProductCard = ({ item }) => (
        <div className="bg-white rounded-xl p-5 flex flex-col border border-gray-300 hover:shadow-lg hover:border-gray-400 transition-all duration-300 group h-full">
            <Link href={`/products/${item.slug || item.id}`} className="flex-1 flex flex-col">
                <div className="h-40 w-full mb-4 flex items-center justify-center overflow-hidden">
                    <img 
                        src={item.image_url || '/images/default_product.png'} 
                        alt={item.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                </div>
                <h3 className="text-[15px] font-medium text-black leading-snug mb-4 line-clamp-2 min-h-[40px] flex items-center">
                    {item.name}
                </h3>
            </Link>
            <div className="mt-auto">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-black">{formatPrice(item.price)} ₽</span>
                    <button className="text-black hover:text-red-500 hover:scale-110 transition-all">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path></svg>
                    </button>
                </div>
                <button 
                    onClick={() => router.post('/cart', { product_id: item.id, quantity: 1 }, { preserveScroll: true })} 
                    className="w-full bg-[#08004E] text-white font-medium py-2.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all"
                >
                    В корзину
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE]">
            <Head title={product?.name || 'Товар'} />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                
                {/* Хлебные крошки */}
                <nav className="flex text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-[#08004E] transition">Главная</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/catalog/search?category=${product?.category?.slug}`} className="hover:text-[#08004E] transition">
                        {product?.category?.name || 'Каталог'}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-black truncate">{product?.name}</span>
                </nav>

                {product ? (
                    <div className="flex flex-col gap-8 w-full font-man">
                        
                        {/* === ВЕРХНИЙ ЭТАЖ: КАРТИНКА И ПОКУПКА === */}
                        <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
                            
                            {/* ЛЕВАЯ ЧАСТЬ (Только главное фото) - 35% */}
                            <div className="w-full lg:w-[35%] xl:w-[35%] shrink-0">
                                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm flex items-center justify-center h-full min-h-[300px] overflow-hidden">
                                     <img 
                                        src={mainImage} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain mix-blend-multiply scale-[0.8] hover:scale-[1.1] transition-transform duration-500" 
                                    />
                                </div>
                            </div>

                            {/* ПРАВАЯ ЧАСТЬ (Блок покупки) - 65% */}
                            <aside className="w-full lg:w-[65%] xl:w-[65%] shrink-0">
                                <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm flex flex-col gap-5 h-full">
                                    
                                    {/* Название и Рейтинг */}
                                    <div>
                                        <h1 className="text-xl sm:text-2xl md:text-2xl font-extrabold text-black leading-snug">
                                            {product.name}
                                        </h1>
                                        {/* === ДОБАВЛЕН БЛОК РЕЙТИНГА === */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} filled={star <= Math.round(product.average_rating || 0)} />
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-black">{Number(product.average_rating || 0).toFixed(1)}</span>
                                            <span className="text-sm text-gray-500 ml-2">({product.reviews?.length || 0} отзывов)</span>
                                        </div>
                                    </div>

                                    {/* Наличие и Код */}
                                    <div className="flex justify-between items-center text-xs sm:text-sm pb-4 border-b border-gray-100 mt-2">
                                        <span className={`${isInStock ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-600 bg-red-50 border border-red-200'} px-3 py-1.5 rounded-full font-bold flex items-center gap-1`}>
                                            {isInStock ? (
                                                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> В наличии: {product.quantity} шт.</>
                                            ) : 'Нет в наличии'}
                                        </span>
                                        <span className="text-gray-400 font-medium">Код товара: {product.id}</span>
                                    </div>

                                    {/* === БЛОК ЦЕНЫ И ПОКУПКИ === */}
                                    <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200 mt-auto">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-5">
                                            {/* Цена */}
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium mb-1">Цена за 1 шт.</p>
                                                <div className="text-3xl sm:text-3xl font-extrabold text-black tracking-tight flex items-baseline gap-1.5">
                                                    {formatPrice(product.price)} <span className="text-xl sm:text-2xl text-gray-500 font-bold">₽</span>
                                                </div>
                                            </div>

                                            {/* Выбор количества */}
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs font-bold text-gray-700">Количество:</span>
                                                <div className="flex items-center bg-white border border-gray-300 rounded-lg h-10 px-1 shadow-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => quantity > 1 && setQuantity((q) => q - 1)}
                                                        className="w-8 h-full font-bold text-xl text-black hover:text-[#08004E] transition"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={quantity}
                                                        onChange={(e) => {
                                                            const raw = String(e.target.value || '').replace(/\D/g, '');
                                                            const next = raw === '' ? '' : Number(raw);
                                                            if (next === '') {
                                                                setQuantity(1);
                                                                return;
                                                            }
                                                            const maxQty = Number(product.quantity || 1);
                                                            const clamped = Math.max(1, Math.min(maxQty, next));
                                                            setQuantity(clamped);
                                                        }}
                                                        onBlur={() => {
                                                            const maxQty = Number(product.quantity || 1);
                                                            const clamped = Math.max(1, Math.min(maxQty, Number(quantity || 1)));
                                                            setQuantity(clamped);
                                                        }}
                                                        className="w-14 text-center font-bold text-base text-black bg-transparent outline-none"
                                                        aria-label="Количество"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => quantity < product.quantity && setQuantity((q) => q + 1)}
                                                        className="w-8 h-full font-bold text-xl text-black hover:text-[#08004E] transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-[11px] text-gray-500">Макс: {product.quantity} шт.</span>
                                            </div>
                                        </div>

                                        {/* БЛОК КНОПОК */}
                                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                                            <Link 
                                                href="/configurator" 
                                                title="Подобрать сборку с этой деталью"
                                                className="flex-1 sm:w-14 sm:flex-none h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#08004E] hover:border-[#08004E] hover:shadow-sm transition-all"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                </svg>
                                            </Link>
                                            
                                            <button 
                                                onClick={addToCart} 
                                                disabled={!isInStock || isLoading}
                                                className="flex-[4] bg-[#08004E] text-white font-bold text-base h-12 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md flex justify-center items-center gap-2"
                                            >
                                                {isLoading ? 'Добавление...' : (isInStock ? (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"></path></svg>
                                                        Добавить в корзину
                                                    </>
                                                ) : 'Нет в наличии')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Блок преимуществ */}
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-gray-600 mt-1">
                                        <div className="flex items-center gap-2 font-medium">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Гарантия от производителя
                                        </div>
                                        <div className="flex items-center gap-2 font-medium">
                                            <svg className="w-5 h-5 text-[#08004E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            14 дней на возврат
                                        </div>
                                    </div>

                                </div>
                            </aside>
                        </div>

                        {/* === НИЖНИЙ ЭТАЖ: ОПИСАНИЕ И ХАРАКТЕРИСТИКИ === */}
                        <div className="w-full flex flex-col gap-8">
                            
                            {/* Описание товара */}
                            {product.description && (
                                <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm w-full">
                                    <h2 className="text-2xl font-bold text-black mb-4">Описание</h2>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Характеристики (EAV) с функцией "Показать все" */}
                            {product.specs?.length > 0 && (
                                <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm w-full transition-all duration-500">
                                    <h2 className="text-2xl font-bold text-black mb-6">Характеристики</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 text-sm md:text-base">
                                        {/* ТЕПЕРЬ ИСПОЛЬЗУЕМ product.specs! */}
                                        {(showAllSpecs ? product.specs : product.specs.slice(0, 8)).map((attr) => (
                                            <div key={attr.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200">
                                                <span className="text-gray-500 w-full sm:w-1/2 pr-2">{attr.name}</span>
                                                <span className="text-black font-medium w-full sm:w-1/2 sm:text-right mt-1 sm:mt-0">{attr.pivot?.value || attr.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {product.specs.length > 8 && (
                                        <button 
                                            onClick={() => setShowAllSpecs(!showAllSpecs)}
                                            className="mt-6 flex items-center gap-2 text-[#08004E] font-bold text-base hover:opacity-70 transition-opacity mx-auto md:mx-0"
                                        >
                                            {showAllSpecs ? 'Свернуть характеристики' : `Все характеристики (${product.specs.length})`}
                                            <svg className={`w-5 h-5 transition-transform duration-300 ${showAllSpecs ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* === ДОБАВЛЕН БЛОК ОТЗЫВОВ === */}
                            <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm w-full mb-8">
                                <h2 className="text-2xl font-bold text-black mb-8 flex items-center gap-3">
                                    Отзывы покупателей 
                                    <span className="text-gray-400 text-lg font-medium">{product.reviews?.length || 0}</span>
                                </h2>

                                {/* Список отзывов */}
                                <div className="flex flex-col gap-6 mb-10">
                                    {product.reviews?.length > 0 ? product.reviews.map(review => (
                                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-black">{review.user?.name || 'Покупатель'}</span>
                                                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('ru-RU')}</span>
                                                </div>
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map(star => <Star key={star} filled={star <= review.rating} />)}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 text-sm md:text-base leading-relaxed">{review.body}</p>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            Пока нет ни одного отзыва. Вы можете стать первым!
                                        </div>
                                    )}
                                </div>

                                {/* Форма написания отзыва */}
                                <div className="bg-[#F8F9FA] rounded-xl p-6 border border-gray-200">
                                    <h3 className="font-bold text-lg text-black mb-4">Оставить отзыв</h3>
                                    {!user ? (
                                        <div className="text-center py-6">
                                            <p className="text-gray-600 mb-4">Только авторизованные пользователи могут оставлять отзывы.</p>
                                            <Link href="/login" className="inline-block border-2 border-[#08004E] text-[#08004E] font-bold py-2 px-6 rounded-lg hover:bg-[#08004E] hover:text-white transition">
                                                Войти в аккаунт
                                            </Link>
                                        </div>
                                    ) : product.has_reviewed ? (
                                        <div className="text-center py-6 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-green-700 font-semibold">Спасибо! Вы уже оставили отзыв на этот товар.</p>
                                        </div>
                                    ) : !product.has_purchased ? (
                                        <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                                            <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                            </svg>
                                            <p className="text-gray-700 font-semibold mb-1">Оставить отзыв могут только покупатели.</p>
                                            <p className="text-gray-500 text-sm">Купите этот товар, и после оплаты вы сможете поделиться впечатлениями.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={submitReview} className="flex flex-col gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Ваша оценка:</label>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star
                                                            key={star}
                                                            filled={star <= reviewData.rating}
                                                            onClick={() => setReviewData('rating', star)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Комментарий:</label>
                                                <textarea
                                                    value={reviewData.body}
                                                    onChange={e => setReviewData('body', e.target.value)}
                                                    rows="4"
                                                    placeholder="Поделитесь впечатлениями о товаре..."
                                                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]"
                                                />
                                                {reviewErrors.body && <span className="text-red-500 text-xs">{reviewErrors.body}</span>}
                                                {reviewErrors.review && <span className="text-red-500 text-xs">{reviewErrors.review}</span>}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={reviewProcessing}
                                                className="bg-[#08004E] text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto hover:bg-opacity-90 transition disabled:opacity-50"
                                            >
                                                {reviewProcessing ? 'Отправка...' : 'Отправить отзыв'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-10 text-center text-gray-500 shadow-sm border border-gray-200">
                        Товар не найден.
                    </div>
                )}

                {/* БЛОК: ПОХОЖИЕ ТОВАРЫ */}
                {relatedProducts?.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-2xl font-bold text-black mb-6">Похожие товары</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {relatedProducts.map(item => (
                                <ProductCard key={item.id} item={item} />
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <Footer />
        </div>
    );
}