import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

// 1. ВЫНЕСЛИ КОМПОНЕНТ НАРУЖУ (Это важно для оптимизации React!)
// Универсальный компонент для карточки категории
const CategoryCard = ({ item }) => {
    // Состояние ошибки загрузки картинки
    const [hasError, setHasError] = useState(false);

    return (
        <Link
            href={`/catalog/search?category=${item.slug}`}
            // Заменили aspect-ratio на h-full, чтобы сетка сама выравнивала высоту карточек
            className="bg-white border border-gray-300 rounded-xl p-4 flex flex-col items-center justify-between hover:shadow-lg hover:border-gray-400 transition-all duration-300 group h-full"
        >
            {/* Добавили flex-1, чтобы картинка занимала все свободное место */}
            <div className="w-full flex-1 flex items-center justify-center overflow-hidden mb-3">
                <img
                    src={hasError ? '/images/default_product.png' : item.image}
                    alt={item.name}
                    onError={() => {
                        if (!hasError) setHasError(true);
                    }}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            
            {/* Добавили min-h-[40px] — это резервирует место ровно под 2 строки для ВСЕХ карточек */}
            <h3 className="text-black font-bold text-sm md:text-base text-center w-full leading-tight min-h-[40px] flex items-center justify-center">
                {item.name}
            </h3>
        </Link>
    );
};

export default function Catalog() {

    // Массив для первой секции (Периферия)
    const peripherals =[
        { name: 'Мониторы', slug: 'monitory', image: '/images/cat_img/monitor.png' },
        { name: 'Клавиатуры', slug: 'klaviatury', image: '/images/cat_img/keyboard.png' },
        { name: 'Мыши', slug: 'mysi', image: '/images/cat_img/mouse.png' },
        { name: 'Наушники', slug: 'nausniki-dlia-pk', image: '/images/cat_img/headphones.png' },
        { name: 'Коврики', slug: 'kovriki-dlia-mysi', image: '/images/cat_img/carpet.png' },
    ];

    // Массив для второй секции (Комплектующие)
    const components =[
        { name: 'Видеокарты', slug: 'videokarty', image: '/images/cat_img/gpu.png' },
        { name: 'Процессоры', slug: 'processory', image: '/images/cat_img/cpu.png' },
        { name: 'Материнские платы', slug: 'materinskie-platy', image: '/images/cat_img/motherboard.png' },
        { name: 'Оперативная память', slug: 'operativnaia-pamiat', image: '/images/cat_img/ozu.png' },
        { name: 'SSD диск', slug: 'sata-ssd-nakopiteli', image: '/images/cat_img/ssd.png' },
        { name: 'Блоки питания', slug: 'bloki-pitaniia', image: '/images/cat_img/psu.png' },
        { name: 'HDD диски', slug: 'zestkii-disk', image: '/images/cat_img/hdd.png' },
        { name: 'SSD M2 диск', slug: 'm2-ssd-nakopiteli', image: '/images/cat_img/ssdm2.png' },
        { name: 'Охлаждение компьютера', slug: 'kulery-dlia-processora', image: '/images/cat_img/cooler.png' },
        { name: 'Корпуса', slug: 'korpusa', image: '/images/cat_img/case.png' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-man">
            <Head title="Каталог товаров" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">

                {/* Заголовок страницы */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12 md:mb-16">
                    Каталог товаров
                </h1>

                {/* Секция: Периферия */}
                <section className="mb-14">
                    <h2 className="text-xl md:text-2xl font-bold text-black mb-6">
                        Периферия для компьютера
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                        {peripherals.map((item, index) => (
                            <CategoryCard key={`periph-${index}`} item={item} />
                        ))}
                    </div>
                </section>

                {/* Секция: Комплектующие */}
                <section className="mb-10">
                    <h2 className="text-xl md:text-2xl font-bold text-black mb-6">
                        Комплектующие для компьютера
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                        {components.map((item, index) => (
                            <CategoryCard key={`comp-${index}`} item={item} />
                        ))}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}