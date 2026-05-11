import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import logoImg from '../images/logo.svg'; 

export default function Header() {
    const { auth } = usePage().props;
    const { url } = usePage();
    const user = auth?.user;
    const isFavoritesPage = url.startsWith('/favorites');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(url.split('?')[1] || '');
        setSearchQuery(params.get('search') || '');
    }, [url]);

    const submitSearch = () => {
        const query = searchQuery.trim();
        if (!query) {
            router.get('/catalog/search');
            return;
        }

        router.get('/catalog/search', { search: query });
    };

    return (
        <header className="w-full font-man max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-8">
             <Link href="/" className="flex-shrink-0 hover:opacity-80 transition">
                <img 
                    src={logoImg} 
                    alt="ASL SHOP" 
                    className="h-8 md:h-8 w-auto object-contain" 
                />
            </Link>
            
            <div className="flex-1 max-w-2xl relative hidden md:block">
                <input 
                    type="text" 
                    placeholder="Поиск по товарам" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            submitSearch();
                        }
                    }}
                    className="w-full bg-transparent border-0 border-b border-gray-400 focus:ring-0 focus:border-[#08004E] px-0 py-2 text-sm text-[#08004E] placeholder-gray-500"
                />
                <button
                    type="button"
                    onClick={submitSearch}
                    className="absolute right-0 top-2.5 text-gray-500 hover:text-[#08004E] transition-colors"
                    aria-label="Искать товары"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </button>
            </div>

            <nav className="flex items-center gap-6 sm:gap-8">
                <Link href="/catalog" className="flex flex-col items-center text-gray-700 hover:text-[#08004E] transition group">
                    <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    <span className="text-xs font-medium">Каталог</span>
                </Link>
            
                <Link href="/cart" className="flex flex-col items-center text-gray-700 hover:text-[#08004E] transition group">
                    <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"></path></svg>
                    <span className="text-xs font-medium">Корзина</span>
                </Link>

                <Link href={user ? "/favorites" : "/login"} className={`flex flex-col items-center transition group ${isFavoritesPage ? 'text-[#08004E]' : 'text-gray-700 hover:text-[#08004E]'}`}>
                    <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill={isFavoritesPage ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                    </svg>
                    <span className="text-xs font-medium">Избранное</span>
                </Link>

                <Link href="/configurator" className="flex flex-col items-center text-gray-700 hover:text-[#08004E] transition group">
                    <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span className="text-xs font-medium">Конфигуратор</span>
                </Link>

                {user?.is_admin ? (
                    <Link href="/admin/dashboard" className="flex flex-col items-center text-gray-700 hover:text-[#08004E] transition group">
                        <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15"></path>
                        </svg>
                        <span className="text-xs font-medium">Админка</span>
                    </Link>
                ) : null}

                <Link href={user ? "/profile" : "/login"} className="flex flex-col items-center text-gray-700 hover:text-[#08004E] transition group">
                    <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span className="text-xs font-medium">Личный кабинет</span>
                </Link>
            </nav>
        </header>
    );
}