// resources/js/Pages/PublicAssemblies.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react'; 
import AssemblyCard from '@/Components/AssemblyCard'; 
import Header from '@/Components/Header'; 
import Footer from '@/Components/Footer'; 

export default function PublicAssemblies() {
    const [assemblies, setAssemblies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextPageUrl, setNextPageUrl] = useState(null);

    // Начальная загрузка
    useEffect(() => {
        setIsLoading(true);
        axios.get('/api/public-assemblies') // <-- Используем новый эндпоинт
            .then(response => {
                setAssemblies(response.data.data);
                setNextPageUrl(response.data.next_page_url);
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Функция подгрузки
    const fetchMoreAssemblies = () => {
        if (!nextPageUrl || isLoadingMore) return;

        setIsLoadingMore(true);
        axios.get(nextPageUrl) // <-- Просто используем готовую ссылку от Laravel
            .then(response => {
                setAssemblies(prev => [...prev, ...response.data.data]);
                setNextPageUrl(response.data.next_page_url);
            })
            .finally(() => setIsLoadingMore(false));
    };

    return (
        <main className="flex flex-col min-h-screen bg-[#3A4750] font-sans text-white">
            <Header />
    
            {/* Основной контейнер с адаптивными отступами */}
            <div className="max-w-7xl flex-grow mt-10 mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <h1 className="text-4xl font-dela text-center mb-10">
                    Пользовательские сборки
                </h1>
    
                {isLoading ? (
                    <p className="text-white text-center py-10">Загрузка сборок...</p>
                ) : (
                    <>
                        {assemblies.length > 0 ? (
                            <div className="space-y-8">
                                {assemblies.map(assembly => (
                                    <AssemblyCard key={assembly.id} assembly={assembly} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-lg">Пока нет ни одной публичной сборки.</p>
                                <p className="text-gray-500 mt-2">Создайте свою и поделитесь ей с сообществом!</p>
                                <Link href={route('configurator')} className="mt-6 inline-block bg-sky-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-500 transition">
                                    Перейти в конфигуратор
                                </Link>
                            </div>
                        )}
                        
                        {/* Кнопка "Загрузить ещё" и индикаторы загрузки (показываются, только если сборки уже есть) */}
                        {assemblies.length > 0 && (
                            <div className="text-center py-10">
                                {isLoadingMore && <p>Загрузка...</p>}
                                {nextPageUrl && !isLoadingMore && (
                                    <button 
                                        onClick={fetchMoreAssemblies}
                                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition"
                                    >
                                        Показать ещё
                                    </button>
                                )}
                                {!nextPageUrl && (
                                    <p className="text-gray-500">Вы просмотрели все сборки</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <Footer />
        </main>
    );
}