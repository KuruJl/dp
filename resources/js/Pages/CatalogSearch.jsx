import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function CatalogSearch({ products, categories }) {
    // Получаем слаг категории из URL (например, ?category=videokarty)
    const queryParams = new URLSearchParams(window.location.search);
    const currentCategorySlug = queryParams.get('category');

    // Находим текущую категорию для заголовка
    const currentCategory = categories?.find(c => c.slug === currentCategorySlug);
    const pageTitle = currentCategory ? currentCategory.name : 'Результаты поиска';
    const currentSearch = queryParams.get('search');

    // Состояния для динамических фильтров от бэкенда
    const [availableFilters, setAvailableFilters] = useState({ price: {min: 0, max: 0}, manufacturers:[], specs: {} });
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedManufacturers, setSelectedManufacturers] = useState([]);
    const [selectedSpecs, setSelectedSpecs] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({
        minPrice: '',
        maxPrice: '',
        manufacturers: [],
        specs: {},
    });
    const [sortBy, setSortBy] = useState('popular');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    
    // Загружаем фильтры с нашего бэкенда при загрузке страницы
    useEffect(() => {
        if (currentCategorySlug) {
            axios.get(`/api/filters/${currentCategorySlug}`).then(res => {
                setAvailableFilters(res.data);
                const urlMin = queryParams.get('min_price');
                const urlMax = queryParams.get('max_price');
                const parsedManufacturers = [];
                const urlSort = queryParams.get('sort');
                const parsedSpecs = {};

                for (const [key, value] of queryParams.entries()) {
                    const manufacturerMatch = key.match(/^manufacturers(?:\[\d*\]|\[\])?$/);
                    if (manufacturerMatch) {
                        parsedManufacturers.push(value);
                        continue;
                    }

                    const specMatch = key.match(/^specs\[(.+)\](?:\[\d*\]|\[\])$/);
                    if (specMatch) {
                        const specName = specMatch[1];
                        if (!parsedSpecs[specName]) parsedSpecs[specName] = [];
                        parsedSpecs[specName].push(value);
                    }
                }

                const nextMin = urlMin ?? (res.data.price?.min ?? '');
                const nextMax = urlMax ?? (res.data.price?.max ?? '');
                setMinPrice(nextMin);
                setMaxPrice(nextMax);
                setSelectedManufacturers(parsedManufacturers);
                setSelectedSpecs(parsedSpecs);
                setSortBy(urlSort || 'popular');
                setAppliedFilters({
                    minPrice: nextMin,
                    maxPrice: nextMax,
                    manufacturers: parsedManufacturers,
                    specs: parsedSpecs,
                });
            }).catch(err => console.error("Ошибка загрузки фильтров", err));
        }
    }, [currentCategorySlug, window.location.search]);

    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val);

    const addToCart = (productId) => {
        router.post('/cart', { product_id: productId, quantity: 1 }, { preserveScroll: true });
    };

    const normalizeSpecs = (product) => {
        const rawSpecs = product?.specs ?? product?.attributes ?? [];

        if (Array.isArray(rawSpecs)) {
            return rawSpecs
                .map((attr) => {
                    if (!attr || typeof attr !== 'object') return null;
                    const name = attr.name;
                    const value = attr.pivot?.value ?? attr.value ?? null;
                    return name && value ? { name, value } : null;
                })
                .filter(Boolean);
        }

        if (rawSpecs && typeof rawSpecs === 'object') {
            return Object.entries(rawSpecs)
                .map(([name, value]) => {
                    if (value && typeof value === 'object') {
                        const objectName = value.name ?? name;
                        const objectValue = value.pivot?.value ?? value.value ?? null;
                        return objectName && objectValue ? { name: objectName, value: objectValue } : null;
                    }
                    return value ? { name, value } : null;
                })
                .filter(Boolean);
        }

        return [];
    };

    const toggleManufacturer = (name) => {
        setSelectedManufacturers((prev) =>
            prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
        );
    };

    const toggleSpecValue = (specName, value) => {
        setSelectedSpecs((prev) => {
            const currentValues = prev[specName] || [];
            const nextValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            const next = { ...prev };
            if (nextValues.length === 0) {
                delete next[specName];
            } else {
                next[specName] = nextValues;
            }
            return next;
        });
    };

    const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

    const getBrandFromProductName = (name) => {
        const parts = String(name ?? '')
            .replace(/[\[\(].*?[\]\)]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
        if (parts.length < 2) return '';
        return parts[1];
    };

    const getProductBrand = (product) => {
        const directBrand = product?.manufacturer?.name;
        if (directBrand) return directBrand;

        const specs = normalizeSpecs(product);
        const modelSpec = specs.find((spec) => normalizeText(spec.name) === 'модель');
        if (modelSpec?.value) {
            const modelFirstToken = String(modelSpec.value).split(/\s+/).filter(Boolean)[0];
            if (modelFirstToken) return modelFirstToken;
        }

        return getBrandFromProductName(product?.name);
    };

    const applyFilters = () => {
        const nextApplied = {
            minPrice,
            maxPrice,
            manufacturers: [...selectedManufacturers],
            specs: { ...selectedSpecs },
        };
        setAppliedFilters(nextApplied);

        router.get('/catalog/search', {
            category: currentCategorySlug || undefined,
            search: currentSearch || undefined,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            manufacturers: selectedManufacturers.length ? selectedManufacturers : undefined,
            specs: Object.keys(selectedSpecs).length ? selectedSpecs : undefined,
            sort: sortBy || 'popular',
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const nextMin = availableFilters.price?.min ?? '';
        const nextMax = availableFilters.price?.max ?? '';
        setMinPrice(nextMin);
        setMaxPrice(nextMax);
        setSelectedManufacturers([]);
        setSelectedSpecs({});
        setAppliedFilters({
            minPrice: nextMin,
            maxPrice: nextMax,
            manufacturers: [],
            specs: {},
        });
        router.get('/catalog/search', {
            category: currentCategorySlug || undefined,
            search: currentSearch || undefined,
            min_price: nextMin || undefined,
            max_price: nextMax || undefined,
            sort: sortBy || 'popular',
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const filteredProducts = useMemo(() => products.data || [], [products.data]);

    const hasActiveFilters =
        appliedFilters.manufacturers.length > 0 ||
        Object.keys(appliedFilters.specs).length > 0 ||
        appliedFilters.minPrice !== (availableFilters.price?.min ?? '') ||
        appliedFilters.maxPrice !== (availableFilters.price?.max ?? '') ||
        sortBy !== 'popular';

    const activeFiltersCount = useMemo(() => {
        let count = appliedFilters.manufacturers.length;
        count += Object.values(appliedFilters.specs).reduce((sum, arr) => sum + arr.length, 0);
        const defaultMin = availableFilters.price?.min ?? '';
        const defaultMax = availableFilters.price?.max ?? '';
        if (appliedFilters.minPrice !== '' && String(appliedFilters.minPrice) !== String(defaultMin)) {
            count += 1;
        }
        if (appliedFilters.maxPrice !== '' && String(appliedFilters.maxPrice) !== String(defaultMax)) {
            count += 1;
        }
        return count;
    }, [appliedFilters, availableFilters.price]);

    useEffect(() => {
        if (!mobileFiltersOpen) {
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
    }, [mobileFiltersOpen]);

    const applyFiltersAndClose = () => {
        applyFilters();
        setMobileFiltersOpen(false);
    };

    const resetFiltersAndClose = () => {
        resetFilters();
        setMobileFiltersOpen(false);
    };

    const handleSortChange = (nextSort) => {
        setSortBy(nextSort);
        if (!currentCategorySlug) return;

        router.get('/catalog/search', {
            category: currentCategorySlug,
            search: currentSearch || undefined,
            min_price: appliedFilters.minPrice || undefined,
            max_price: appliedFilters.maxPrice || undefined,
            manufacturers: appliedFilters.manufacturers.length ? appliedFilters.manufacturers : undefined,
            specs: Object.keys(appliedFilters.specs).length ? appliedFilters.specs : undefined,
            sort: nextSort || 'popular',
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // Компонент горизонтальной карточки товара
    const ProductCardHorizontal = ({ product }) => {
        // Проверяем, можно ли этот товар добавить в сборку
        const isConfiguratorItem =[
            'korpusa', 'materinskie-platy', 'processory', 'kulery-dlia-processora',
            'operativnaia-pamiat', 'videokarty', 'm2-ssd-nakopiteli', 'sata-ssd-nakopiteli',
            'zestkii-disk', 'bloki-pitaniia'
        ].includes(product.category?.slug);

        return (
            <div className="bg-white rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center hover:shadow-md transition-shadow duration-300 border border-transparent hover:border-gray-200">
                <Link href={`/products/${product.slug || product.id}`} className="w-full sm:w-40 md:w-56 h-28 sm:h-40 flex-shrink-0 flex items-center justify-center p-2">
                    <img src={product.image_url || '/images/default_product.png'} alt={product.name} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500" />
                </Link>

                 <div className="flex-1 w-full">
                <Link href={`/products/${product.slug || product.id}`}>
                    <h3 className="text-sm sm:text-lg font-bold text-black leading-snug hover:text-[#08004E] transition-colors">{product.name}</h3>
                </Link>
                
                {/* === УМНОЕ ОПИСАНИЕ (Характеристики) === */}
                <div className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2 pr-4 min-h-[32px]">
                    {(() => {
                        const specs = normalizeSpecs(product);

                        if (specs.length === 0) {
                            return product.description || "Характеристики отсутствуют в базе";
                        }

                        const cleanSpecs = specs
                            .filter(attr => {
                                const name = attr.name.toLowerCase();
                                return !name.includes('гаранти') && 
                                       !name.includes('стран') && 
                                       !name.includes('цвет') && 
                                       !name.includes('модель');
                            })
                            .slice(0, 5)
                            .map(attr => `${attr.name}: ${attr.value}`);

                        return cleanSpecs.length > 0 
                            ? cleanSpecs.join(' • ') 
                            : (product.description || "Характеристики отсутствуют");
                    })()}
                </div>
            </div>

                {/* Цена и кнопки */}
                <div className="w-full sm:w-48 flex flex-col items-stretch sm:items-end gap-3 sm:gap-4 shrink-0">
                    <div className="text-lg sm:text-2xl font-extrabold text-black whitespace-nowrap">
                        {formatPrice(product.price)} ₽
                    </div>
                    
                    <div className="flex gap-2 w-full">
                        {/* Кнопка конфигуратора (Показываем только для комплектующих) */}
                        {isConfiguratorItem && (
                            <Link 
                                href="/configurator"
                                title="Выбрать в конфигураторе"
                                className="w-12 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#08004E] hover:border-[#08004E] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </Link>
                        )}

                        {/* Кнопка Купить (Растягивается на всю ширину, если шестеренки нет) */}
                        <button 
                            onClick={() => addToCart(product.id)}
                            className="flex-1 h-10 bg-[#08004E] text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Купить
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    // Блок фильтра со строкой поиска и чекбоксами
     // Блок фильтра со строкой поиска и чекбоксами (ИСПРАВЛЕННЫЙ)
    // Блок фильтра со строкой поиска и чекбоксами
    const FilterBlock = ({ title, items, selectedValues = [], onToggle }) => {
        const[searchTerm, setSearchTerm] = useState('');
        const [showAll, setShowAll] = useState(false);

        if (!items || items.length === 0) return null;

        const normalizedItems = items
            .map((item) => {
                const rawLabel = item && typeof item === 'object' ? (item?.name ?? item?.label ?? item?.value) : item;
                const label = rawLabel == null ? '' : String(rawLabel);
                const value = rawLabel == null ? '' : String(rawLabel);
                return { label, value };
            })
            .filter((item) => item.value !== '');

        const filteredItems = normalizedItems.filter((item) =>
            item.label.toLowerCase().includes(String(searchTerm || '').toLowerCase())
        );

        const selectedSet = new Set((selectedValues || []).map((v) => (v == null ? '' : String(v))));
        const selectedItems = filteredItems.filter((item) => selectedSet.has(item.value));
        const unselectedItems = filteredItems.filter((item) => !selectedSet.has(item.value));
        const visibleItems = showAll ? filteredItems : [...selectedItems, ...unselectedItems.slice(0, 4)];

        return (
            <div className="mb-6">
                <h3 className="font-bold text-black mb-3">{title}</h3>
                <input 
                    type="text" 
                    placeholder="Поиск" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-400 rounded-md px-3 py-1.5 text-sm text-black placeholder-gray-500 focus:ring-[#08004E] focus:border-[#08004E] mb-3" 
                />
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-hide pr-2">
                    {visibleItems.map((item, idx) => (
                        <label key={`${item.value}-${idx}`} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedSet.has(item.value)}
                                onChange={() => onToggle?.(item.value)}
                                className="w-4 h-4 text-[#08004E] border-gray-400 rounded-sm focus:ring-[#08004E]"
                            />
                            <span className="text-sm text-black group-hover:text-[#08004E] transition-colors">{item.label}</span>
                        </label>
                    ))}
                </div>
                {filteredItems.length > 4 && (
                    <button
                        type="button"
                        onClick={() => setShowAll((prev) => !prev)}
                        className="text-xs text-[#08004E] font-semibold mt-3 hover:underline"
                    >
                        {showAll ? 'Скрыть' : 'Показать все'}
                    </button>
                )}
            </div>
        );
    };

    const filtersPanelContent = (onApply, onReset) => (
        <>
            <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Цена</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder={`от ${availableFilters.price?.min || 0}`}
                        className="w-1/2 bg-white border border-gray-400 rounded-md px-3 py-1.5 text-sm text-black placeholder-gray-500 focus:ring-[#08004E] focus:border-[#08004E]"
                    />
                    <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder={`до ${availableFilters.price?.max || 100000}`}
                        className="w-1/2 bg-white border border-gray-400 rounded-md px-3 py-1.5 text-sm text-black placeholder-gray-500 focus:ring-[#08004E] focus:border-[#08004E]"
                    />
                </div>
            </div>
            <FilterBlock
                title="Бренд"
                items={availableFilters.manufacturers}
                selectedValues={selectedManufacturers}
                onToggle={toggleManufacturer}
            />
            {availableFilters.specs &&
                Object.entries(availableFilters.specs).map(([specName, specValues]) => (
                    <FilterBlock
                        key={specName}
                        title={specName}
                        items={specValues}
                        selectedValues={selectedSpecs[specName] || []}
                        onToggle={(value) => toggleSpecValue(specName, value)}
                    />
                ))}
            <div className="flex gap-2 mt-2">
                <button type="button" onClick={onApply} className="flex-1 h-10 bg-[#08004E] text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-colors">
                    Применить
                </button>
                <button type="button" onClick={onReset} className="h-10 px-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                    Сброс
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex flex-col font-man">
            <Head title={pageTitle} />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 sm:mb-8 break-words">{pageTitle}</h1>

                <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
                    <aside className="hidden lg:block w-full lg:w-[280px] shrink-0 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        {filtersPanelContent(applyFilters, resetFilters)}
                    </aside>

                    <section className="flex-1 w-full min-w-0 max-w-full lg:max-w-[calc(100%-312px)]">
                        <div className="bg-white rounded-xl py-3 px-4 sm:px-5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-gray-200">
                            <div className="text-sm font-medium min-w-0">
                                <span className="text-gray-500">Сортировка: </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="text-[#08004E] font-bold ml-1 bg-transparent outline-none max-w-[10rem] sm:max-w-none"
                                >
                                    <option value="popular">сначала популярные</option>
                                    <option value="price_asc">сначала дешевые</option>
                                    <option value="price_desc">сначала дорогие</option>
                                </select>
                            </div>
                            {currentCategorySlug ? (
                                <button
                                    type="button"
                                    onClick={() => setMobileFiltersOpen(true)}
                                    className="lg:hidden inline-flex items-center gap-2 h-9 px-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 bg-white hover:border-[#08004E] hover:text-[#08004E] transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h6M3 16h3M14 8l4 4-4 4" />
                                    </svg>
                                    Фильтры
                                    {activeFiltersCount > 0 ? (
                                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#08004E] text-white text-xs font-bold flex items-center justify-center">
                                            {activeFiltersCount}
                                        </span>
                                    ) : null}
                                </button>
                            ) : null}
                        </div>

                        {/* Список товаров */}
                        <div className="flex flex-col gap-4">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <ProductCardHorizontal key={product.id} product={product} />
                                ))
                            ) : (
                                <div className="bg-white rounded-xl p-10 text-center text-gray-500 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span className="text-lg">Товары по выбранным фильтрам не найдены.</span>
                                </div>
                            )}
                        </div>

                        {/* Пагинация */}
                        {products.links?.length > 3 && (
                            <div className="mt-8 flex justify-center flex-wrap gap-2">
                                {products.links.map((link, i) => (
                                    link.url ? (
                                        <Link key={i} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }}
                                              className={`px-4 py-2 rounded-lg transition text-sm font-medium ${link.active ? 'bg-[#08004E] text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`} />
                                    ) : (
                                        <span key={i} dangerouslySetInnerHTML={{ __html: link.label }} className="px-4 py-2 text-gray-400 bg-white/50 rounded-lg text-sm border border-gray-200" />
                                    )
                                ))}
                            </div>
                        )}
                    </section>

                </div>
            </main>

            {mobileFiltersOpen && currentCategorySlug ? (
                <div className="fixed inset-0 z-50 lg:hidden">
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
                        <div className="flex-1 overflow-y-auto p-4">
                            {filtersPanelContent(applyFiltersAndClose, resetFiltersAndClose)}
                        </div>
                    </div>
                </div>
            ) : null}

            <Footer />
        </div>
    );
}