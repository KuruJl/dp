import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function AdminLayout({ title, children, active = 'dashboard' }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const linkClass = (key) =>
        `w-full font-semibold py-3 px-4 rounded-lg text-center transition-all ${
            active === key
                ? 'bg-[#08004E] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-[#08004E] border border-transparent hover:border-gray-200'
        }`;

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title={title || 'Админка'} />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12">
                    Админ-панель
                </h1>

                <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                    <aside className="w-full lg:w-[280px] shrink-0 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-center">
                        <div className="w-24 h-24 bg-[#08004E] rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <span className="text-4xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                        </div>
                        <h2 className="text-xl font-bold text-black mb-8 text-center w-full truncate px-2">
                            {user?.name}
                        </h2>

                        <nav className="w-full flex flex-col gap-2">
                            <Link href="/admin/dashboard" className={linkClass('dashboard')}>Дашборд</Link>
                            <Link href="/admin/users" className={linkClass('users')}>Пользователи</Link>
                            <Link href="/admin/orders" className={linkClass('orders')}>Заказы</Link>
                            <Link href="/admin/categories" className={linkClass('categories')}>Категории</Link>
                            <Link href="/admin/reviews" className={linkClass('reviews')}>Отзывы</Link>
                            <Link href="/admin/products" className={linkClass('products')}>Товары</Link>
                            <Link href="/admin/reports" className={linkClass('reports')}>Отчёты</Link>
                            <Link href="/admin/promocodes" className={linkClass('promocodes')}>Промокоды</Link>
                            <Link href="/admin/pickup-points" className={linkClass('pickup-points')}>Пункты выдачи</Link>
                        </nav>
                    </aside>

                    <section className="flex-1 w-full bg-white rounded-xl p-6 md:p-10 border border-gray-200 shadow-sm min-w-0">
                        {children}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

