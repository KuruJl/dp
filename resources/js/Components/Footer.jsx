import React from 'react';
import { Link } from '@inertiajs/react';
import logoImg from '../images/logo.svg'; 

export default function Footer() {
    return (
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-16 border-t border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">

                {/* ЛОГОТИП */}
                <div className="col-span-1">
                    <Link href="/" className="flex-shrink-0 hover:opacity-80 transition">
                        <img
                            src={logoImg}
                            alt="ASL SHOP"
                            className="h-8 md:h-8 w-auto object-contain"
                        />
                    </Link>
                </div>

                {/* КОЛОНКА 1 */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-black font-extrabold text-sm mb-2">Покупателям</h3>
                    <Link href="/configurator" className="text-gray-600 hover:text-[#08004E] text-sm transition">Конфигуратор ПК</Link>
                    <Link href="/faq" className="text-gray-600 hover:text-[#08004E] text-sm transition">FAQ</Link>
                    <Link href="/warranty" className="text-gray-600 hover:text-[#08004E] text-sm transition">Гарантия и возврат</Link>
                </div>

                {/* КОЛОНКА 2 */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-black font-extrabold text-sm mb-2">Наши соцсети</h3>
                    <a href="#" className="text-gray-600 hover:text-[#08004E] text-sm transition">Telegram</a>
                    <a href="#" className="text-gray-600 hover:text-[#08004E] text-sm transition">VK</a>
                    <a href="#" className="text-gray-600 hover:text-[#08004E] text-sm transition">Youtube</a>
                </div>

                {/* КОЛОНКА 3 */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-black font-extrabold text-sm mb-2">Контакты</h3>
                    <a href="tel:88002504158" className="text-gray-600 hover:text-[#08004E] text-sm transition font-medium">88002504158</a>
                    <a href="tel:+74959214158" className="text-gray-600 hover:text-[#08004E] text-sm transition font-medium">+74959214158</a>
                </div>

            </div>
        </footer>
    );
}