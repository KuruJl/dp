import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import ProfileSidebar from '@/Components/ProfileSidebar';

export default function Assemblies({ assemblies = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val || 0);
    const [expanded, setExpanded] = useState({});

    const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    const loadInConfigurator = (id) => {
        router.visit(`/configurator?load=${id}`);
    };

    const deleteAssembly = (id) => {
        if (!window.confirm('Удалить сохраненную сборку?')) return;
        axios.delete(`/api/assemblies/${id}`)
            .then(() => router.reload({ only: ['assemblies'] }))
            .catch(() => alert('Не удалось удалить сборку.'));
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Конфигурации" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12">
                    Личный кабинет
                </h1>

                <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                    <ProfileSidebar user={user} activeTab="assemblies" />

                    <section className="flex-1 w-full bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm min-w-0">
                        <h2 className="text-2xl font-extrabold text-black mb-3">Конфигурации</h2>
                        <p className="text-gray-600 mb-6">Ваши сохраненные сборки.</p>

                        {assemblies.length === 0 ? (
                            <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-8 text-center">
                                <p className="text-black font-semibold mb-2">У вас пока нет сохраненных конфигураций</p>
                                <p className="text-sm text-gray-500 mb-5">Создайте первую сборку в конфигураторе.</p>
                                <Link href="/configurator" className="inline-block bg-[#08004E] text-white font-semibold px-6 py-3 rounded-lg hover:bg-opacity-90 transition">
                                    Перейти в конфигуратор
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assemblies.map((assembly) => {
                                    const isOpen = !!expanded[assembly.id];
                                    return (
                                        <article key={assembly.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                                            <button
                                                type="button"
                                                onClick={() => toggle(assembly.id)}
                                                className="w-full flex flex-wrap md:flex-nowrap items-start gap-4 p-5 text-left hover:bg-gray-50 transition"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-black truncate">{assembly.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Создано: {assembly.created_at} • Компонентов: {assembly.items_count}
                                                    </p>
                                                    {assembly.description && (
                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-1">{assembly.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <p className="text-lg font-extrabold text-black whitespace-nowrap">
                                                        {formatPrice(assembly.total_amount)} ₽
                                                    </p>
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
                                                <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/60">
                                                    <div className="pt-4">
                                                        {assembly.items?.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {assembly.items.map((item) => (
                                                                    <div key={`${assembly.id}-${item.id}`} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
                                                                        <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
                                                                            <img
                                                                                src={item.image_url || '/images/default_product.png'}
                                                                                alt={item.name}
                                                                                className="max-w-full max-h-full object-contain"
                                                                            />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            {item.slug ? (
                                                                                <Link
                                                                                    href={`/products/${item.slug}`}
                                                                                    className="text-sm font-semibold text-black hover:text-[#08004E] transition line-clamp-2"
                                                                                >
                                                                                    {item.name}
                                                                                </Link>
                                                                            ) : (
                                                                                <p className="text-sm font-semibold text-black line-clamp-2">{item.name}</p>
                                                                            )}
                                                                            {item.category_name && (
                                                                                <p className="text-xs text-gray-500 mt-0.5">{item.category_name}</p>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm font-bold text-black whitespace-nowrap">
                                                                            {formatPrice(item.price)} ₽
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500">Сборка пуста.</p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-3 mt-5">
                                                            <button
                                                                type="button"
                                                                onClick={() => loadInConfigurator(assembly.id)}
                                                                className="bg-[#08004E] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-opacity-90 transition"
                                                            >
                                                                Загрузить в конфигуратор
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteAssembly(assembly.id)}
                                                                className="border border-gray-300 text-gray-700 font-bold px-5 py-2.5 rounded-lg hover:border-red-400 hover:text-red-600 transition"
                                                            >
                                                                Удалить
                                                            </button>
                                                            <p className="ml-auto text-sm text-gray-500">
                                                                Итого: <span className="font-extrabold text-black">{formatPrice(assembly.total_amount)} ₽</span>
                                                            </p>
                                                        </div>
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
