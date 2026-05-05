import React from 'react';
import { Link } from '@inertiajs/react';

export default function ProfileSidebar({ user, activeTab = 'profile' }) {
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    const linkClass = (tabKey) =>
        `w-full font-semibold py-3 px-4 rounded-lg text-center transition-all ${
            activeTab === tabKey
                ? 'bg-[#08004E] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-[#08004E] border border-transparent hover:border-gray-200'
        }`;

    return (
        <aside className="w-full lg:w-[280px] shrink-0 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 bg-[#08004E] rounded-full flex items-center justify-center mb-4 shadow-inner">
                <span className="text-4xl font-bold text-white">{initial}</span>
            </div>

            <h2 className="text-xl font-bold text-black mb-8 text-center w-full truncate px-2">
                {user?.name}
            </h2>

            <nav className="w-full flex flex-col gap-2">
                <Link href="/profile" className={linkClass('profile')}>
                    Профиль
                </Link>
                <Link href="/profile/orders" className={linkClass('orders')}>
                    Заказы
                </Link>
                <Link href="/profile/reviews" className={linkClass('reviews')}>
                    Мои отзывы
                </Link>
                <Link href="/my-assemblies" className={linkClass('assemblies')}>
                    Конфигурации
                </Link>
            </nav>
        </aside>
    );
}
