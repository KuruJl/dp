// resources/js/Pages/Admin/Dashboard.jsx

import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function Dashboard({ auth }) {
    return (
        <AdminLayout title="Админ-панель" active="dashboard">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-black">
                    Добро пожаловать, {auth.user.name}!
                </h2>
                <p className="text-gray-600 mt-2">Выберите раздел для управления контентом.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/users" className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition">
                    <div className="text-lg font-bold text-black">Пользователи</div>
                    <div className="text-sm text-gray-600 mt-1">Роли и аккаунты пользователей.</div>
                </Link>
                <Link href="/admin/orders" className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition">
                    <div className="text-lg font-bold text-black">Заказы</div>
                    <div className="text-sm text-gray-600 mt-1">Статусы и поиск по заказам.</div>
                </Link>
                <Link href="/admin/categories" className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition">
                    <div className="text-lg font-bold text-black">Категории</div>
                    <div className="text-sm text-gray-600 mt-1">Создание и управление категориями.</div>
                </Link>
                <Link href="/admin/reviews" className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition">
                    <div className="text-lg font-bold text-black">Отзывы</div>
                    <div className="text-sm text-gray-600 mt-1">Модерация отзывов.</div>
                </Link>
                <Link href="/admin/products" className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition">
                    <div className="text-lg font-bold text-black">Товары</div>
                    <div className="text-sm text-gray-600 mt-1">Поиск и статус товаров.</div>
                </Link>
                <Link href="/admin/promocodes" className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition">
                    <div className="text-lg font-bold text-black">Промокоды</div>
                    <div className="text-sm text-gray-600 mt-1">Создание, отключение, лимиты и срок.</div>
                </Link>
            </div>
        </AdminLayout>
    );
}