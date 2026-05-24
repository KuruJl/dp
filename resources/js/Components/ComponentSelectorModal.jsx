// resources/js/Components/ComponentSelectorModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import ProductCard from '@/Components/ProductCard';
import useDebounce from '@/hooks/useDebounce.js';

/** Слоты конфигуратора: `/api/filters/{slug}` отдаёт характеристики в порядке приоритета */
const CONFIGURATOR_CATEGORY_SLUGS = new Set([
    'korpusa',
    'materinskie-platy',
    'kulery-dlia-processora',
    'processory',
    'operativnaia-pamiat',
    'videokarty',
    'm2-ssd-nakopiteli',
    'sata-ssd-nakopiteli',
    'zestkii-disk',
    'bloki-pitaniia',
]);

const CONFIGURATOR_MODAL_SPEC_BLOCKS = 5;
const DEFAULT_MODAL_SPEC_BLOCKS = 3;

export default function ComponentSelectorModal({ isOpen, onClose, categoryInfo, onComponentSelect }) {
    const { auth } = usePage().props;
    const isAdmin = !!auth?.user?.is_admin;

    const [components, setComponents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [availableFilters, setAvailableFilters] = useState({ price: { min: 0, max: 0 }, manufacturers: [], specs: {} });
    const [activeFilters, setActiveFilters] = useState({
        manufacturers: [],
        minPrice: '',
        maxPrice: '',
        specs: {},
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
    });
    
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (!isOpen || !mobileFiltersOpen) {
            return;
        }
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setMobileFiltersOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, mobileFiltersOpen]);

    const generateExportUrl = () => {
        const params = new URLSearchParams();
        
        if (categoryInfo?.categorySlug) {
            params.append('category', categoryInfo.categorySlug);
        }
        if (debouncedSearchQuery) {
            params.append('search', debouncedSearchQuery);
        }
        activeFilters.manufacturers.forEach(id => {
            params.append('manufacturers[]', id);
        });
        if (activeFilters.minPrice !== '') {
            params.append('min_price', activeFilters.minPrice);
        }
        if (activeFilters.maxPrice !== '') {
            params.append('max_price', activeFilters.maxPrice);
        }
        Object.entries(activeFilters.specs).forEach(([specName, values]) => {
            values.forEach((value) => params.append(`specs[${specName}][]`, value));
        });

        // URL теперь ведет на защищенный админский маршрут
        return `/api/admin/components/export-pdf?${params.toString()}`;
    };

    // Загрузка доступных фильтров
    useEffect(() => {
        if (isOpen && categoryInfo) {
            // Сбрасываем фильтры и поиск при открытии нового окна
            setSearchQuery('');
            setCurrentPage(1);
            
            axios.get(`/api/filters/${categoryInfo.categorySlug}`)
                .then(response => {
                    const filterData = response.data || {};
                    setAvailableFilters(filterData);
                    setActiveFilters({
                        manufacturers: [],
                        minPrice: filterData.price?.min ?? '',
                        maxPrice: filterData.price?.max ?? '',
                        specs: {},
                    });
                });
        }
    }, [isOpen, categoryInfo]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearchQuery,
        activeFilters.manufacturers,
        activeFilters.minPrice,
        activeFilters.maxPrice,
        activeFilters.specs,
        categoryInfo?.categorySlug
    ]);

    // Загрузка списка товаров
    useEffect(() => {
        if (isOpen && categoryInfo) {
            setIsLoading(true);
            const params = {
                category: categoryInfo.categorySlug,
                manufacturers: activeFilters.manufacturers,
                search: debouncedSearchQuery,
                min_price: activeFilters.minPrice,
                max_price: activeFilters.maxPrice,
                specs: activeFilters.specs,
                page: currentPage,
                per_page: 12,
            };
            axios.get(`/api/components`, { params })
                .then(response => {
                    setComponents(response.data?.data || []);
                    setPaginationMeta(response.data?.meta || {
                        current_page: 1,
                        last_page: 1,
                        total: 0,
                        from: 0,
                        to: 0,
                    });
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, categoryInfo, activeFilters, debouncedSearchQuery, currentPage]);

    const handleManufacturerFilterChange = (manufacturerId) => {
        setActiveFilters(prev => {
            const manufacturers = prev.manufacturers.includes(manufacturerId)
                ? prev.manufacturers.filter(id => id !== manufacturerId)
                : [...prev.manufacturers, manufacturerId];
            return { ...prev, manufacturers };
        });
    };

    const handleSpecFilterChange = (specName, value) => {
        setActiveFilters((prev) => {
            const currentValues = prev.specs[specName] || [];
            const nextValues = currentValues.includes(value)
                ? currentValues.filter((v) => v !== value)
                : [...currentValues, value];

            const nextSpecs = { ...prev.specs };
            if (nextValues.length === 0) delete nextSpecs[specName];
            else nextSpecs[specName] = nextValues;

            return { ...prev, specs: nextSpecs };
        });
    };

    const resetFilters = () => {
        setSearchQuery('');
        setActiveFilters({
            manufacturers: [],
            minPrice: availableFilters.price?.min ?? '',
            maxPrice: availableFilters.price?.max ?? '',
            specs: {},
        });
    };

    const specEntries = Object.entries(availableFilters.specs || {});
    const slug = categoryInfo?.categorySlug;
    const importantSpecs = CONFIGURATOR_CATEGORY_SLUGS.has(slug)
        ? specEntries.slice(0, CONFIGURATOR_MODAL_SPEC_BLOCKS)
        : specEntries
              .sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0))
              .slice(0, DEFAULT_MODAL_SPEC_BLOCKS);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Выберите ${categoryInfo?.displayName || 'компонент'}`}
        >
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 text-black">
                <div className="lg:hidden flex flex-col gap-3 shrink-0">
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]"
                    />
                    <button
                        type="button"
                        onClick={() => setMobileFiltersOpen(true)}
                        className="inline-flex items-center justify-center gap-2 h-10 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 bg-white hover:border-[#08004E] hover:text-[#08004E] transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h6M3 16h3M14 8l4 4-4 4" />
                        </svg>
                        Фильтры
                    </button>
                </div>

                <aside className="hidden lg:block col-span-1 border-r border-gray-200 pr-6 max-h-[65vh] overflow-y-auto">
                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]"
                        />
                    </div>

                    <h3 className="font-bold mb-3 text-base">Цена</h3>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        <input
                            type="number"
                            value={activeFilters.minPrice}
                            onChange={(e) => setActiveFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                            placeholder={`от ${availableFilters.price?.min ?? 0}`}
                            className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-[#08004E] focus:border-[#08004E]"
                        />
                        <input
                            type="number"
                            value={activeFilters.maxPrice}
                            onChange={(e) => setActiveFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                            placeholder={`до ${availableFilters.price?.max ?? 0}`}
                            className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-[#08004E] focus:border-[#08004E]"
                        />
                    </div>

                    <h3 className="font-bold mb-3 text-base">Производитель</h3>
                    <div className="space-y-2 text-sm">
                         {availableFilters.manufacturers.map(m => (
                            <label key={m.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-[#08004E] focus:ring-[#08004E]"
                                    checked={activeFilters.manufacturers.includes(m.id)}
                                    onChange={() => handleManufacturerFilterChange(m.id)}
                                />
                                <span>{m.name}</span>
                            </label>
                        ))}
                    </div>

                    {importantSpecs.map(([specName, values]) => (
                        <div key={specName} className="mt-5">
                            <h4 className="font-bold mb-2 text-sm">{specName}</h4>
                            <div className="space-y-2 text-sm max-h-32 overflow-y-auto pr-1">
                                {values.slice(0, 8).map((value) => (
                                    <label key={`${specName}-${value}`} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[#08004E] focus:ring-[#08004E]"
                                            checked={(activeFilters.specs[specName] || []).includes(value)}
                                            onChange={() => handleSpecFilterChange(specName, value)}
                                        />
                                        <span className="line-clamp-1">{value}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-6 w-full border border-gray-300 text-gray-700 font-semibold text-sm py-2.5 rounded-md hover:bg-gray-50 transition"
                    >
                        Сбросить фильтры
                    </button>
                </aside>

                {mobileFiltersOpen ? (
                    <div className="fixed inset-0 z-[120] lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/50"
                            aria-label="Закрыть фильтры"
                            onClick={() => setMobileFiltersOpen(false)}
                        />
                        <div className="absolute inset-y-0 left-0 w-[min(100%,320px)] bg-white shadow-xl flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
                                <h2 className="text-lg font-bold text-black">Фильтры</h2>
                                <button
                                    type="button"
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="text-gray-500 hover:text-[#08004E] text-2xl leading-none"
                                    aria-label="Закрыть"
                                >
                                    &times;
                                </button>
                            </div>
                            <aside className="flex-1 overflow-y-auto p-4 border-0 max-h-none">
                                <h3 className="font-bold mb-3 text-base">Цена</h3>
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    <input
                                        type="number"
                                        value={activeFilters.minPrice}
                                        onChange={(e) => setActiveFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                                        placeholder={`от ${availableFilters.price?.min ?? 0}`}
                                        className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-[#08004E] focus:border-[#08004E]"
                                    />
                                    <input
                                        type="number"
                                        value={activeFilters.maxPrice}
                                        onChange={(e) => setActiveFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                                        placeholder={`до ${availableFilters.price?.max ?? 0}`}
                                        className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-[#08004E] focus:border-[#08004E]"
                                    />
                                </div>
                                <h3 className="font-bold mb-3 text-base">Производитель</h3>
                                <div className="space-y-2 text-sm mb-5">
                                    {availableFilters.manufacturers.map((m) => (
                                        <label key={m.id} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[#08004E] focus:ring-[#08004E]"
                                                checked={activeFilters.manufacturers.includes(m.id)}
                                                onChange={() => handleManufacturerFilterChange(m.id)}
                                            />
                                            <span>{m.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {importantSpecs.map(([specName, values]) => (
                                    <div key={specName} className="mt-5">
                                        <h4 className="font-bold mb-2 text-sm">{specName}</h4>
                                        <div className="space-y-2 text-sm max-h-32 overflow-y-auto pr-1">
                                            {values.slice(0, 8).map((value) => (
                                                <label key={`${specName}-${value}`} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-[#08004E] focus:ring-[#08004E]"
                                                        checked={(activeFilters.specs[specName] || []).includes(value)}
                                                        onChange={() => handleSpecFilterChange(specName, value)}
                                                    />
                                                    <span className="line-clamp-1">{value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetFilters();
                                        setMobileFiltersOpen(false);
                                    }}
                                    className="mt-6 w-full border border-gray-300 text-gray-700 font-semibold text-sm py-2.5 rounded-md hover:bg-gray-50 transition"
                                >
                                    Сбросить фильтры
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="mt-2 w-full bg-[#08004E] text-white font-semibold text-sm py-2.5 rounded-md hover:bg-opacity-90 transition"
                                >
                                    Показать
                                </button>
                            </aside>
                        </div>
                    </div>
                ) : null}

                <main className="lg:col-span-3 flex flex-col max-h-[50vh] sm:max-h-[60vh] min-h-0">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <p className="text-sm text-gray-500">
                            {paginationMeta.total > 0
                                ? `Показано ${paginationMeta.from}-${paginationMeta.to} из ${paginationMeta.total}`
                                : 'Ничего не найдено'}
                        </p>
                        {isAdmin ? (
                            <a 
                                href={generateExportUrl()}
                                target="_blank"
                                className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-500 active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                Экспорт в PDF
                            </a>
                        ) : null}
                    </div>
                    
                    <div className="flex-grow overflow-y-auto">
                        {isLoading ? (
                            <p className="text-gray-500">Загрузка...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {components.map(component => (
                                    <ProductCard
                                        key={component.id}
                                        component={component}
                                        onSelect={onComponentSelect}
                                    />
                                ))}
                                {components.length === 0 && !isLoading && (
                                    <p className="col-span-full text-center text-gray-500">Товары не найдены.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {paginationMeta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || isLoading}
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                className="px-3 py-1.5 text-sm border border-gray-300 bg-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                            >
                                Назад
                            </button>
                            <span className="text-sm text-gray-600">
                                {paginationMeta.current_page} / {paginationMeta.last_page}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= paginationMeta.last_page || isLoading}
                                onClick={() => setCurrentPage((prev) => Math.min(paginationMeta.last_page, prev + 1))}
                                className="px-3 py-1.5 text-sm border border-gray-300 bg-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                            >
                                Вперёд
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </Modal>
    );
}