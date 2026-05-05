// resources/js/Layouts/Admin/AdminHeaderLayout.jsx

import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function AdminHeaderLayout({ children, header }) {
    const { auth } = usePage().props;
    const isDashboard = route().current('admin.dashboard');

    return (
        <div className="min-h-screen bg-[#3A4750] font-sans text-white">
            {/* --- Шапка (Header) --- */}
            <header className="w-full flex items-center justify-between px-8 sm:px-16 py-6 bg-[#3A4750] ">
                <div className="flex items-center space-x-6">
                    {isDashboard ? (
                        <Link href={route('configurator')} className="font-dela text-4xl [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                            WPlace
                        </Link>
                    ) : (
                        <Link 
                            href={route('admin.dashboard')} 
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Назад на дашборд"
                        >
                            <ArrowLeftIcon className="w-7 h-7" />
                        </Link>
                    )}
                    <h1 className="text-3xl font-dela text-gray-200 hidden md:block">{header}</h1>
                </div>
                <div className="flex items-center space-x-6 text-xl">
                    <span className="text-gray-300 hidden sm:block">{auth.user.name}</span>
                     <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button"
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Выйти"
                    >
                        <ArrowRightOnRectangleIcon className="w-7 h-7" />
                    </Link>
                </div>
            </header>

            {/* --- Основной контент (С ИЗМЕНЕНИЯМИ) --- */}
            <main className="w-full py-8 px-4  sm:px-6 lg:px-8"> 
                {children}
            </main>
        </div>
    );
}