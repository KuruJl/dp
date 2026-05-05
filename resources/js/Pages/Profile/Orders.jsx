import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import ProfileSidebar from '@/Components/ProfileSidebar';

export default function Orders({ orders = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val || 0);
    const [expanded, setExpanded] = useState({});

    const toggle = (id) =>
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    const statusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('достав')) return 'bg-green-100 text-green-700';
        if (s.includes('отмен')) return 'bg-red-100 text-red-700';
        if (s.includes('оплат')) return 'bg-amber-100 text-amber-700';
        if (s.includes('нов')) return 'bg-blue-100 text-blue-700';
        return 'bg-[#08004E]/10 text-[#08004E]';
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Мои заказы" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12">
                    Личный кабинет
                </h1>

                <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                    <ProfileSidebar user={user} activeTab="orders" />

                    <section className="flex-1 w-full bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm min-w-0">
                        <h2 className="text-2xl font-extrabold text-black mb-6">Мои заказы</h2>

                        {orders.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <p className="text-gray-600 mb-4">У вас пока нет оформленных заказов.</p>
                                <Link href="/catalog" className="inline-block bg-[#08004E] text-white font-semibold px-6 py-3 rounded-lg hover:bg-opacity-90 transition">
                                    Перейти в каталог
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => {
                                    const isOpen = !!expanded[order.id];
                                    return (
                                        <article
                                            key={order.id}
                                            className="border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggle(order.id)}
                                                className="w-full flex flex-wrap md:flex-nowrap items-center gap-4 p-5 text-left hover:bg-gray-50 transition"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-bold text-black truncate">
                                                            Заказ {order.order_number}
                                                        </h3>
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {order.created_at} • товаров: {order.items_count}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Итого</p>
                                                        <p className="text-lg font-extrabold text-black whitespace-nowrap">
                                                            {formatPrice(order.total_amount)} ₽
                                                        </p>
                                                    </div>
                                                    <svg
                                                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="2"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50/60">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-5 pt-4">
                                                        <div>
                                                            <span className="text-gray-500">Способ доставки:</span>{' '}
                                                            <span className="font-semibold text-black">{order.delivery_method || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Оплата:</span>{' '}
                                                            <span className="font-semibold text-black">{order.payment_method || '—'}</span>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <span className="text-gray-500">Адрес/пункт:</span>{' '}
                                                            <span className="font-semibold text-black">{order.delivery_address || '—'}</span>
                                                        </div>
                                                        {order.delivery_time && (
                                                            <div>
                                                                <span className="text-gray-500">Дата доставки:</span>{' '}
                                                                <span className="font-semibold text-black">{order.delivery_time}</span>
                                                            </div>
                                                        )}
                                                        {order.promocode && (
                                                            <div>
                                                                <span className="text-gray-500">Промокод:</span>{' '}
                                                                <span className="font-semibold text-green-700">{order.promocode}</span>
                                                            </div>
                                                        )}
                                                        {order.comment && (
                                                            <div className="md:col-span-2">
                                                                <span className="text-gray-500">Комментарий:</span>{' '}
                                                                <span className="font-semibold text-black">{order.comment}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {order.items.map((item, idx) => (
                                                            <div
                                                                key={`${order.id}-${idx}`}
                                                                className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3"
                                                            >
                                                                <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
                                                                    <img
                                                                        src={item.image_url || '/images/default_product.png'}
                                                                        alt={item.product_name}
                                                                        className="max-w-full max-h-full object-contain"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    {item.product_slug ? (
                                                                        <Link
                                                                            href={`/products/${item.product_slug}`}
                                                                            className="text-sm font-semibold text-black hover:text-[#08004E] transition line-clamp-2"
                                                                        >
                                                                            {item.product_name}
                                                                        </Link>
                                                                    ) : (
                                                                        <p className="text-sm font-semibold text-black line-clamp-2">
                                                                            {item.product_name}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        {formatPrice(item.price)} ₽ × {item.quantity}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm font-bold text-black whitespace-nowrap">
                                                                    {formatPrice(item.price * item.quantity)} ₽
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            {Number(order.discount_amount || 0) > 0 && (
                                                                <div className="flex items-center justify-between gap-4 text-sm mb-1">
                                                                    <span className="text-gray-500">Скидка по промокоду</span>
                                                                    <span className="font-bold text-green-600">- {formatPrice(order.discount_amount)} ₽</span>
                                                                </div>
                                                            )}
                                                            <span className="text-sm text-gray-500">Итого</span>
                                                        </div>
                                                        <span className="text-xl font-extrabold text-black">
                                                            {formatPrice(order.total_amount)} ₽
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
