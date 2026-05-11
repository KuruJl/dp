import React, { useState, useEffect } from "react";
import axios from "axios";
import { Head, Link, usePage, router } from "@inertiajs/react"; 
import Header from "@/Components/Header"; 
import Footer from "@/Components/Footer"; 
import Modal from "@/Components/Modal"; 
import ComponentSelectorModal from "@/Components/ComponentSelectorModal";
import Configurator2DView from "@/Components/Configurator/Configurator2DView";
import Configurator3DView from "@/Components/Configurator/Configurator3DView";

// Импортируем твои родные плейсхолдеры
import motherboardPlaceholderUrl from "@/Components/DeskPlaceholders/MotherboardPlaceholder.svg";
import cpuPlaceholderUrl from "@/Components/DeskPlaceholders/CpuPlaceholder.svg";
import coolerPlaceholderUrl from "@/Components/DeskPlaceholders/CulerPlaceholder.svg";
import gpuPlaceholderUrl from "@/Components/DeskPlaceholders/GpuPlaceholder.svg";
import hddPlaceholderUrl from "@/Components/DeskPlaceholders/HddPlaceholder.svg";
import m2PlaceholderUrl from "@/Components/DeskPlaceholders/M2Placeholder.svg";
import psuPlaceholderUrl from "@/Components/DeskPlaceholders/PsuPlaceholder.svg";
import ramPlaceholderUrl from "@/Components/DeskPlaceholders/RamPlaceholder.svg";
import ssdPlaceholderUrl from "@/Components/DeskPlaceholders/SsdPlaceholder.svg";

// ТВОИ ИДЕАЛЬНЫЕ КООРДИНАТЫ (Ничего не менял)
const componentSlots =[
    // Корпус мы не рисуем внутри схемы (он и так фон), поэтому координат у него нет
    { 
        categorySlug: "korpusa", displayName: "Корпус*", isRequired: true, 
        placeholderUrl: null 
    },
    {
        categorySlug: "materinskie-platy", displayName: "Материнская плата*", isRequired: true,
        placeholderUrl: "/images/motherboard.webp",
        imagePosition: "top-[18%] left-[13%] w-[40%] h-[45%]", buttonPosition: "top-[16%] left-[11%] w-5 h-5",
    },
    {
        categorySlug: "kulery-dlia-processora", displayName: "Система охлаждения", isRequired: false,
        placeholderUrl: "/images/culer.webp",
        imagePosition: "top-[23%] left-[25%] w-[15%] h-[20%]", buttonPosition: "top-[21%] left-[22%] w-5 h-5",
    },
    {
        categorySlug: "processory", displayName: "Процессор*", isRequired: true,
        placeholderUrl: "/images/cpu.webp",
        imagePosition: "top-[28%] left-[27%] w-[7%] h-[12%]", buttonPosition: "top-[28%] left-[32%] w-5 h-5",
    },
    {
        categorySlug: "operativnaia-pamiat", displayName: "Оперативная память", isRequired: false,
        placeholderUrl: "/images/RAM.webp",
        imagePosition: "top-[23%] left-[40%] w-[12%] h-[20%]", buttonPosition: "top-[20%] left-[46%] w-5 h-5",
        secondaryImagePosition: "top-[23%] left-[47%] w-[12%] h-[20%]",
    },
    {
        categorySlug: "videokarty", displayName: "Видеокарта", isRequired: false,
        placeholderUrl: "/images/gpu.webp",
        imagePosition: "top-[40%] left-[15%] w-[36%] h-[20%]", buttonPosition: "top-[44%] left-[13%] w-5 h-5",
    },
    {
        categorySlug: "m2-ssd-nakopiteli", displayName: "Накопитель SSD (M.2)", isRequired: false,
        placeholderUrl: "/images/ssdM2.webp",
        imagePosition: "top-[46%] left-[22%] w-[15%] h-[20%]", buttonPosition: "top-[56%] left-[19%] w-5 h-5",
    },
    {
        categorySlug: "sata-ssd-nakopiteli", displayName: "Накопитель SSD (2.5\")", isRequired: false,
        placeholderUrl: "/images/ssd.webp",
        imagePosition: "top-[28%] left-[67%] w-[15%] h-[20%]", buttonPosition: "top-[30%] left-[79%] w-5 h-5",
    },
    {
        categorySlug: "zestkii-disk", displayName: "Жесткий диск (HDD)", isRequired: false,
        placeholderUrl: "/images/hdd.webp",
        imagePosition: "top-[35%] left-[63%] w-[22%] h-[25%]", buttonPosition: "top-[47%] left-[82%] w-5 h-5",
    },
    {
        categorySlug: "bloki-pitaniia", displayName: "Блок питания", isRequired: false,
        placeholderUrl: "/images/psu.webp",
        imagePosition: "top-[61%] left-[14%] w-[30%] h-[30%]", buttonPosition: "top-[64%] left-[41%] w-5 h-5",
    },
];

const getCleanName = (fullName) => {
    if (!fullName) return "";
    const bracketIndex = fullName.indexOf("[");
    if (bracketIndex !== -1) return fullName.substring(0, bracketIndex).trim();
    return fullName;
};
const getSlotKey = (slot) => slot.slotKey || slot.categorySlug;

const initialAssembly = componentSlots.reduce((acc, slot) => {
    acc[getSlotKey(slot)] = null;
    return acc;
}, {});



export default function Index({ editingAssemblyId = null, loadAssemblyId = null }) {
    const { auth } = usePage().props;
    
    // Состояния
    const [assembly, setAssembly] = useState(initialAssembly);
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window === 'undefined') return '2d';
        return localStorage.getItem('configurator_view_mode') || '2d';
    });
    const [isSceneExpanded, setIsSceneExpanded] = useState(false);
    const[isModalOpen, setIsModalOpen] = useState(false);
    const [selectingCategory, setSelectingCategory] = useState(null);
    const [compatibilityErrors, setCompatibilityErrors] = useState([]);
    const [compatibilityWarnings, setCompatibilityWarnings] = useState([]);
    const [isCheckingCompatibility, setIsCheckingCompatibility] = useState(false);
    const[isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [assemblyName, setAssemblyName] = useState("");
    const[currentAssemblyId, setCurrentAssemblyId] = useState(editingAssemblyId);
    const [pendingLoadId, setPendingLoadId] = useState(null);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [pendingLoadName, setPendingLoadName] = useState("");

    const applyLoadedAssembly = (id, replaceCurrent) => {
        axios.get(`/api/assemblies/${id}`)
            .then((res) => {
                const loaded = res.data;
                setAssemblyName(loaded.name || '');
                const base = replaceCurrent ? { ...initialAssembly } : { ...assembly };
                loaded.components.forEach((c) => {
                    if (c.category) base[c.category.slug] = c;
                });
                setAssembly(base);
                checkCompatibility(base);
                if (replaceCurrent) {
                    localStorage.removeItem('assembly_new');
                }
            })
            .catch(() => alert('Не удалось загрузить сборку.'));
    };

    // Загрузка данных
    useEffect(() => {
        if (currentAssemblyId) {
            axios.get(`/api/assemblies/${currentAssemblyId}`)
                .then((res) => {
                    const loaded = res.data;
                    setAssemblyName(loaded.name);
                    const serverState = { ...initialAssembly };
                    loaded.components.forEach((c) => {
                        if (c.category) serverState[c.category.slug] = c;
                    });
                    setAssembly(serverState);
                    checkCompatibility(serverState);
                })
                .catch(console.error);
        } else {
            const stored = localStorage.getItem("assembly_new");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setAssembly(parsed);
                    checkCompatibility(parsed);
                } catch (e) {
                    localStorage.removeItem("assembly_new");
                }
            }
        }
    }, [currentAssemblyId]);

    useEffect(() => {
        if (!loadAssemblyId) return;
        const hasAnyComponent = Object.values(assembly).some((c) => c !== null);
        axios
            .get(`/api/assemblies/${loadAssemblyId}`)
            .then((res) => {
                setPendingLoadName(res.data?.name || 'Сохраненная сборка');
            })
            .catch(() => setPendingLoadName('Сохраненная сборка'));

        setPendingLoadId(loadAssemblyId);
        if (hasAnyComponent) {
            setShowLoadModal(true);
        } else {
            applyLoadedAssembly(loadAssemblyId, true);
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('load');
                window.history.replaceState({}, '', url.toString());
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadAssemblyId]);

    // Автосохранение
    useEffect(() => {
        if (!currentAssemblyId) localStorage.setItem("assembly_new", JSON.stringify(assembly));
    }, [assembly]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('configurator_view_mode', viewMode);
    }, [viewMode]);

    // Проверка совместимости
    const checkCompatibility = (currentAssembly) => {
        const ids = Object.values(currentAssembly).filter(c => c !== null).map(c => c.id);
        if (ids.length > 1) {
            setIsCheckingCompatibility(true);
            axios.post("/api/assemblies/check-compatibility", { component_ids: ids })
                .then(() => {
                    setCompatibilityErrors([]);
                    setCompatibilityWarnings([]);
                })
                .catch((error) => {
                    if (error.response?.status === 422) {
                        const messages = error.response.data.errors || [];
                        const warnings = messages.filter((msg) => String(msg).toLowerCase().includes('предупреждение'));
                        const errors = messages.filter((msg) => !String(msg).toLowerCase().includes('предупреждение'));
                        setCompatibilityWarnings(warnings);
                        setCompatibilityErrors(errors);
                    } else {
                        setCompatibilityErrors(['Не удалось выполнить проверку совместимости. Попробуйте еще раз.']);
                        setCompatibilityWarnings([]);
                    }
                })
                .finally(() => setIsCheckingCompatibility(false));
        } else {
            setCompatibilityErrors([]);
            setCompatibilityWarnings([]);
            setIsCheckingCompatibility(false);
        }
    };

    // Взаимодействие со слотами
    const handlePlaceholderClick = (slot) => {
        setSelectingCategory({
            categorySlug: slot.categorySlug,
            displayName: slot.displayName,
            slotKey: getSlotKey(slot),
        });
        setIsModalOpen(true);
    };

    const handleComponentSelect = (component) => {
        const slotKey = selectingCategory.slotKey || selectingCategory.categorySlug;
        const newAssembly = { ...assembly,[slotKey]: component };
        setAssembly(newAssembly);
        setIsModalOpen(false);
        checkCompatibility(newAssembly);
    };

    const handleComponentClear = (categorySlug, e) => {
        e.stopPropagation();
        const newAssembly = { ...assembly, [categorySlug]: null };
        setAssembly(newAssembly);
        checkCompatibility(newAssembly);
    };

    const handleResetAssembly = () => {
        if (!window.confirm('Очистить текущую конфигурацию?')) return;
        setAssembly(initialAssembly);
        setCompatibilityErrors([]);
        setCompatibilityWarnings([]);
        setAssemblyName('');
        setCurrentAssemblyId(null);
        localStorage.removeItem('assembly_new');
    };

    // Сохранение сборки в профиль
    const handleConfirmSave = () => {
        const ids = Object.values(assembly).filter(c => c !== null).map(c => c.id);
        if (ids.length === 0) return alert("Ваша сборка пуста!");
        if (!assemblyName.trim()) return alert("Введите название сборки.");

        const request = currentAssemblyId 
            ? axios.patch(`/api/assemblies/${currentAssemblyId}`, { name: assemblyName, component_ids: ids })
            : axios.post("/api/assemblies", { name: assemblyName, component_ids: ids });

        request.then(() => {
            alert("Сборка успешно сохранена!");
            window.location.href = route("my-assemblies");
        }).catch(() => alert("Ошибка сохранения."));
    };

    // --- НОВАЯ СУПЕР-КНОПКА: Добавить всё в корзину ---
    const handleAddAssemblyToCart = () => {
        const components = Object.values(assembly).filter(c => c !== null);
        if (components.length === 0) return alert("Сборка пуста! Выберите комплектующие.");

        // Отправляем все товары в корзину по очереди
        const promises = components.map(c => 
            axios.post('/cart', { product_id: c.id, quantity: 1 })
        );

        Promise.all(promises).then(() => {
            router.visit('/cart'); // Переходим в корзину
        }).catch(() => alert("Произошла ошибка при добавлении в корзину."));
    };

    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val);

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Конфигуратор ПК" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-10">Конфигуратор</h1>

                <div className="border border-gray-400 rounded-xl p-6 md:p-10 flex flex-col lg:flex-row items-start gap-10 bg-transparent relative">
                    
                    <div className="flex-1 w-full min-w-0">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-black">Системный блок</h2>
                            <p className="text-sm text-gray-500">*обязательные комплектующие</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {componentSlots.map(slot => {
                                const slotKey = getSlotKey(slot);
                                const selectedItem = assembly[slotKey];

                                return selectedItem ? (
                                    <div key={slotKey} className="bg-white border-2 border-[#08004E] rounded-md p-3 flex items-center gap-4 shadow-sm transition">
                                        <div className="w-32 md:w-40 font-bold text-sm text-black shrink-0">{slot.displayName}</div>
                                        <div className="w-12 h-12 shrink-0 flex items-center justify-center p-1 bg-gray-50 rounded">
                                            <img src={selectedItem.image_url || '/images/default_product.png'} alt="img" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0 py-2 pr-4">
                                            
                                            <p className="text-sm font-bold text-black leading-snug mb-1">
                                                {getCleanName(selectedItem.name)}
                                            </p>
                                            
                                            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                                {selectedItem.attributes && selectedItem.attributes.length > 0 
                                                    ? selectedItem.attributes.map(attr => attr.pivot.value).join(', ')
                                                    : selectedItem.description
                                                }
                                            </p>
                                            
                                        </div>
                                        <div className="text-lg font-extrabold text-black whitespace-nowrap shrink-0">
                                            {formatPrice(selectedItem.price)} ₽
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-2">
                                            <button onClick={() => handlePlaceholderClick(slot)} className="text-gray-500 hover:text-[#08004E] transition" title="Заменить">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                            </button>
                                            <button onClick={(e) => handleComponentClear(slotKey, e)} className="text-gray-500 hover:text-red-500 transition" title="Удалить">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={slotKey} onClick={() => handlePlaceholderClick(slot)} className="bg-white/50 border border-gray-300 rounded-md p-3 flex items-center gap-4 cursor-pointer hover:border-[#08004E] hover:bg-white transition group h-[76px]">
                                        <div className="w-32 md:w-40 font-bold text-sm text-black shrink-0">{slot.displayName}</div>
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-gray-400 group-hover:text-[#08004E] transition flex items-center gap-2 text-sm font-medium">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                Выбрать
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* === КОНЕЦ ЛЕВОЙ КОЛОНКИ === */}

                    {/* === ПРАВАЯ КОЛОНКА (Схема ПК и Кнопки) === */}
                    <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 h-full">
                        
                        <div className="flex flex-col gap-4 lg:sticky lg:top-8 pb-8">

                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-bold text-black">Режим</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSceneExpanded(true)}
                                        className="px-3 py-2 text-sm font-extrabold rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition"
                                        title="Развернуть"
                                    >
                                        Развернуть
                                    </button>
                                    <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('2d')}
                                        className={`px-4 py-2 text-sm font-extrabold transition ${
                                            viewMode === '2d' ? 'bg-[#08004E] text-white' : 'text-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        2D
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('3d')}
                                        className={`px-4 py-2 text-sm font-extrabold transition ${
                                            viewMode === '3d' ? 'bg-[#08004E] text-white' : 'text-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        3D
                                    </button>
                                    </div>
                                </div>
                            </div>
                        
                            {/* Темно-синий блок со схемой */}
                            {viewMode === '2d' && (
                                <Configurator2DView
                                    componentSlots={componentSlots}
                                    assembly={assembly}
                                    onSlotClick={handlePlaceholderClick}
                                />
                            )}

                            {viewMode === '3d' && (
                                <Configurator3DView
                                    componentSlots={componentSlots}
                                    assembly={assembly}
                                    onSlotClick={handlePlaceholderClick}
                                    isExpanded={false}
                                />
                            )}

                            <div className="flex flex-col gap-3 mt-2">
                                <button onClick={() => auth.user ? setIsSaveModalOpen(true) : alert('Войдите, чтобы сохранить черновик сборки')} className="w-full bg-white text-black font-extrabold text-lg py-4 rounded-md border border-gray-300 hover:border-[#08004E] hover:shadow-md transition">
                                    Сохранить сборку
                                </button>
                                <button
                                    onClick={handleResetAssembly}
                                    className="w-full bg-white text-gray-700 font-bold text-base py-3 rounded-md border border-gray-300 hover:border-red-400 hover:text-red-600 transition"
                                >
                                    Быстрая очистка
                                </button>
                                <button onClick={handleAddAssemblyToCart} className="w-full bg-[#08004E] text-white font-extrabold text-lg py-4 rounded-md hover:bg-opacity-90 active:scale-[0.98] transition shadow-md">
                                    Добавить сборку в корзину
                                </button>

                                {/* Статус проверки совместимости */}
                                {isCheckingCompatibility && (
                                    <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin text-[#08004E]" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"></circle>
                                            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
                                        </svg>
                                        Проверяем совместимость...
                                    </div>
                                )}

                                {/* Блок ошибок совместимости */}
                                {compatibilityErrors.length > 0 && (
                                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2 text-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                            </svg>
                                            Обнаружены проблемы совместимости
                                        </h3>
                                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                            {compatibilityErrors.map((error, idx) => <li key={`err-${idx}`}>{error}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {/* Блок предупреждений совместимости */}
                                {compatibilityWarnings.length > 0 && (
                                    <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <h3 className="font-bold text-amber-700 mb-2 flex items-center gap-2 text-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 3l9 16H3l9-16z"></path>
                                            </svg>
                                            Предупреждения совместимости
                                        </h3>
                                        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                            {compatibilityWarnings.map((warning, idx) => <li key={`warn-${idx}`}>{warning}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* === КОНЕЦ ПРАВОЙ КОЛОНКИ === */}

                </div> 
                {/* === ЗАКРЫТИЕ ГЛАВНОЙ СЕРОЙ РАМКИ === */}
            </main>

            {/* Модальное окно сохранения */}
            <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title="Сохранение сборки">
                <div className="space-y-4 p-4">
                    <label className="block text-sm font-bold text-black">Название сборки:</label>
                    <input type="text" value={assemblyName} onChange={e => setAssemblyName(e.target.value)} className="w-full p-3 bg-white border border-gray-400 rounded-md focus:ring-[#08004E]" />
                    <button onClick={handleConfirmSave} className="w-full bg-[#08004E] text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition">
                        Подтвердить
                    </button>
                </div>
            </Modal>

            <ComponentSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categoryInfo={selectingCategory} onComponentSelect={handleComponentSelect} />

            <Modal
                isOpen={showLoadModal}
                onClose={() => {
                    setShowLoadModal(false);
                    setPendingLoadId(null);
                    if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('load');
                        window.history.replaceState({}, '', url.toString());
                    }
                }}
                title="Загрузить сборку в конфигуратор?"
            >
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-700">
                        У вас уже есть комплектующие в конфигураторе. Что сделать с текущей сборкой перед загрузкой
                        <span className="font-bold text-black"> «{pendingLoadName}»</span>?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (!auth?.user) {
                                    alert('Войдите, чтобы сохранить текущую сборку');
                                    return;
                                }
                                setShowLoadModal(false);
                                setIsSaveModalOpen(true);
                            }}
                            className="bg-white text-black font-bold py-3 rounded-lg border border-gray-300 hover:border-[#08004E] transition"
                        >
                            Сохранить текущую
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (pendingLoadId) applyLoadedAssembly(pendingLoadId, true);
                                setShowLoadModal(false);
                                setPendingLoadId(null);
                                if (typeof window !== 'undefined') {
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete('load');
                                    window.history.replaceState({}, '', url.toString());
                                }
                            }}
                            className="bg-[#08004E] text-white font-extrabold py-3 rounded-lg hover:bg-opacity-90 transition"
                        >
                            Очистить и загрузить
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (pendingLoadId) applyLoadedAssembly(pendingLoadId, false);
                            setShowLoadModal(false);
                            setPendingLoadId(null);
                            if (typeof window !== 'undefined') {
                                const url = new URL(window.location.href);
                                url.searchParams.delete('load');
                                window.history.replaceState({}, '', url.toString());
                            }
                        }}
                        className="w-full bg-white text-gray-700 font-bold py-3 rounded-lg border border-gray-300 hover:border-[#08004E] hover:text-[#08004E] transition"
                    >
                        Дополнить текущую (существующие слоты будут перезаписаны)
                    </button>
                </div>
            </Modal>
            
            {isSceneExpanded && (
                <div className="fixed inset-0 z-[100] bg-black/60 p-4 sm:p-8">
                    <div className="w-full h-full max-w-6xl mx-auto bg-[#DEDEDE] rounded-2xl border border-gray-300 shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
                            <div className="font-extrabold text-black">
                                {viewMode === '3d' ? '3D Конфигуратор' : '2D Схема'}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSceneExpanded(false)}
                                className="px-4 py-2 rounded-lg bg-[#08004E] text-white font-extrabold hover:bg-opacity-90 transition"
                            >
                                Свернуть
                            </button>
                        </div>

                        <div className="flex-1 p-4 sm:p-6 overflow-auto">
                            {viewMode === '2d' && (
                                <Configurator2DView
                                    componentSlots={componentSlots}
                                    assembly={assembly}
                                    onSlotClick={handlePlaceholderClick}
                                />
                            )}

                            {viewMode === '3d' && (
                                <Configurator3DView
                                    componentSlots={componentSlots}
                                    assembly={assembly}
                                    onSlotClick={handlePlaceholderClick}
                                    isExpanded={true}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
