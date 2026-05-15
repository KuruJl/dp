import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import logoImg from '../images/logo.svg';

export default function Header() {
    const { auth } = usePage().props;
    const { url } = usePage();
    const user = auth?.user;
    const isFavoritesPage = url.startsWith('/favorites');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(url.split('?')[1] || '');
        setSearchQuery(params.get('search') || '');
    }, [url]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [url]);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [mobileMenuOpen]);

    const submitSearch = () => {
        const query = searchQuery.trim();
        if (!query) {
            router.get('/catalog/search');
            return;
        }

        router.get('/catalog/search', { search: query });
        setMobileMenuOpen(false);
    };

    const navLinkClass = 'flex flex-col items-center text-gray-700 hover:text-[#08004E] transition group';
    const drawerLinkClass =
        'flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold text-black hover:bg-gray-100 active:bg-gray-200 transition';

    return (
        <header className="relative z-40 w-full font-man max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex items-center justify-between gap-3 lg:gap-8">
                <Link href="/" className="flex-shrink-0 hover:opacity-80 transition min-w-0">
                    <img src={logoImg} alt="ASL SHOP" className="h-7 sm:h-8 w-auto object-contain" />
                </Link>

                <div className="flex-1 max-w-2xl relative hidden lg:block min-w-0">
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

                <nav className="hidden lg:flex items-center gap-5 xl:gap-8 shrink-0">
                    <Link href="/catalog" className={navLinkClass}>
                        <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                        </svg>
                        <span className="text-xs font-medium whitespace-nowrap">Каталог</span>
                    </Link>

                    <Link href="/cart" className={navLinkClass}>
                        <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                        </svg>
                        <span className="text-xs font-medium whitespace-nowrap">Корзина</span>
                    </Link>

                    <Link
                        href={user ? '/favorites' : '/login'}
                        className={`${navLinkClass} ${isFavoritesPage ? 'text-[#08004E]' : ''}`}
                    >
                        <svg
                            className="w-6 h-6 mb-1 group-hover:scale-110 transition"
                            fill={isFavoritesPage ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                        </svg>
                        <span className="text-xs font-medium whitespace-nowrap">Избранное</span>
                    </Link>

                    <Link href="/configurator" className={navLinkClass}>
                        <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="text-xs font-medium whitespace-nowrap">Конфигуратор</span>
                    </Link>

                    {user?.is_admin ? (
                        <Link href="/admin/dashboard" className={navLinkClass}>
                            <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15"></path>
                            </svg>
                            <span className="text-xs font-medium whitespace-nowrap">Админка</span>
                        </Link>
                    ) : null}

                    <Link href={user ? '/profile' : '/login'} className={navLinkClass}>
                        <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span className="text-xs font-medium whitespace-nowrap">Кабинет</span>
                    </Link>
                </nav>

                <div className="flex items-center gap-2 lg:hidden shrink-0">
                    <Link
                        href="/cart"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-[#08004E] hover:text-[#08004E] transition"
                        aria-label="Корзина"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                        </svg>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-[#08004E] hover:text-[#08004E] transition"
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav-drawer"
                        aria-label="Открыть меню"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {mobileMenuOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden" id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Меню сайта">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-label="Закрыть меню"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <span className="text-sm font-extrabold text-black">Меню</span>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                                aria-label="Закрыть"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="border-b border-gray-100 p-4">
                            <label className="mb-1.5 block text-xs font-bold text-gray-600">Поиск</label>
                            <div className="relative flex gap-2">
                                <input
                                    type="search"
                                    placeholder="Товары…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            submitSearch();
                                        }
                                    }}
                                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black focus:border-[#08004E] focus:ring-1 focus:ring-[#08004E]"
                                />
                                <button
                                    type="button"
                                    onClick={submitSearch}
                                    className="shrink-0 rounded-lg bg-[#08004E] px-3 py-2 text-white hover:bg-opacity-90"
                                    aria-label="Искать"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
                            <Link href="/catalog" className={drawerLinkClass} onClick={() => setMobileMenuOpen(false)}>
                                <svg className="h-6 w-6 shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                Каталог
                            </Link>
                            <Link href="/cart" className={drawerLinkClass} onClick={() => setMobileMenuOpen(false)}>
                                <svg className="h-6 w-6 shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                                Корзина
                            </Link>
                            <Link
                                href={user ? '/favorites' : '/login'}
                                className={drawerLinkClass}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <svg
                                    className="h-6 w-6 shrink-0 text-gray-600"
                                    fill={isFavoritesPage ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                                Избранное
                            </Link>
                            <Link href="/configurator" className={drawerLinkClass} onClick={() => setMobileMenuOpen(false)}>
                                <svg className="h-6 w-6 shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Конфигуратор
                            </Link>
                            {user?.is_admin ? (
                                <Link href="/admin/dashboard" className={drawerLinkClass} onClick={() => setMobileMenuOpen(false)}>
                                    <svg className="h-6 w-6 shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15" />
                                    </svg>
                                    Админка
                                </Link>
                            ) : null}
                            <Link href={user ? '/profile' : '/login'} className={drawerLinkClass} onClick={() => setMobileMenuOpen(false)}>
                                <svg className="h-6 w-6 shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Личный кабинет
                            </Link>
                        </nav>
                    </div>
                </div>
            ) : null}
        </header>
    );
}