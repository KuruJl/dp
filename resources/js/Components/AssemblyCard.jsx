// resources/js/Components/AssemblyCard.jsx

import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import CommentSection from "./CommentSection";

const getCleanName = (fullName) => {
    if (!fullName) return "";
    const bracketIndex = fullName.indexOf("[");
    return bracketIndex !== -1
        ? fullName.substring(0, bracketIndex).trim()
        : fullName;
};

function PeripheralPreview({ assembly }) {
    const peripherals = {
        monitor: assembly.components.find((c) => c.category.slug === "monitory"),
        keyboard: assembly.components.find((c) => c.category.slug === "klaviatury"),
        mouse: assembly.components.find((c) => c.category.slug === "mysi"),
        headset: assembly.components.find((c) => c.category.slug === "nausniki-dlia-pk"),
    };

    return (
        <div className="flex flex-col items-center gap-4 text-white">
            <div className="w-[250px] flex flex-col border-2 border-gray-700 rounded-xl items-center gap-y-1">
                <div className="w-full h-40 rounded-lg flex items-center justify-center">
                    {peripherals.monitor ? (
                        <img src={peripherals.monitor.image_url} alt={peripherals.monitor.name} className="w-full rounded-lg h-full bg-white object-contain p-4" />
                    ) : (
                        <span className="text-2xl font-dela">Монитор</span>
                    )}
                </div>
            </div>
            <div className="h-8 text-center">
                {peripherals.monitor && (<p className="text-xs font-days text-gray-300">{getCleanName(peripherals.monitor.name)}</p>)}
            </div>
            <div className="w-full grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-y-1">
                    <div className="w-full h-28 bg-[#3A4750] border border-gray-700 rounded-lg flex items-center justify-center">
                        {peripherals.keyboard ? (
                            <img src={peripherals.keyboard.image_url} alt={peripherals.keyboard.name} className="w-full h-full bg-white rounded-lg object-contain p-2" />
                        ) : (
                            <span className="text-gray-400">Клавиатура</span>
                        )}
                    </div>
                    <div className="h-8 text-center">
                        {peripherals.keyboard && (<p className="text-xs font-days text-gray-300">{getCleanName(peripherals.keyboard.name)}</p>)}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-y-1">
                    <div className="w-full h-28 bg-[#3A4750] border border-gray-700 rounded-lg flex items-center justify-center">
                        {peripherals.mouse ? (
                            <img src={peripherals.mouse.image_url} alt={peripherals.mouse.name} className="w-full h-full bg-white rounded-lg object-contain p-2" />
                        ) : (
                            <span className="font-dela text-gray-400">Мышка</span>
                        )}
                    </div>
                    <div className="h-8 text-center">
                        {peripherals.mouse && (<p className="text-xs font-days text-gray-300">{getCleanName(peripherals.mouse.name)}</p>)}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-y-1">
                    <div className="w-full h-28 bg-[#3A4750] border border-gray-700 rounded-lg flex items-center justify-center">
                        {peripherals.headset ? (
                            <img src={peripherals.headset.image_url} alt={peripherals.headset.name} className="w-full h-full bg-white rounded-lg object-contain p-2" />
                        ) : (
                            <span className="font-dela text-gray-400">Наушники</span>
                        )}
                    </div>
                    <div className="h-8 text-center">
                        {peripherals.headset && (<p className="text-xs font-days text-gray-300">{getCleanName(peripherals.headset.name)}</p>)}
                    </div>
                </div>
            </div>
            
        </div>
    );
}

// --- ИЗМЕНЕНИЕ ЗДЕСЬ: Добавляем 'compatibilityErrors' в список пропсов ---
export default function AssemblyCard({ assembly, showActions = true, compatibilityErrors = [] }) {
    const { auth } = usePage().props;
    const [likeCount, setLikeCount] = useState(assembly.likers_count);
    const [isLiked, setIsLiked] = useState(assembly.is_liked_by_user);
    const [isProcessingLike, setIsProcessingLike] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const handleLike = () => {
        if (isProcessingLike || !auth.user) {
            if (!auth.user) alert("Пожалуйста, войдите в систему, чтобы оценить сборку.");
            return;
        }
        setIsProcessingLike(true);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        setIsLiked((prev) => !prev);
        axios.post(`/api/assemblies/${assembly.id}/toggle-like`)
            .then((response) => {
                setLikeCount(response.data.likers_count);
            })
            .catch((error) => {
                console.error("Ошибка при обработке лайка:", error);
                setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
                setIsLiked((prev) => !prev);
                alert("Не удалось оценить сборку.");
            })
            .finally(() => {
                setIsProcessingLike(false);
            });
    };

    const pcComponents = assembly.components.filter((c) => c.category.type === "component");
    const totalPrice = assembly.components.reduce((sum, c) => sum + c.price, 0);

    return (
        <div className="bg-[#303841] border border-gray-700 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-dela text-white">{assembly.name}</h3>
                <span className="text-sm text-gray-400 text-right shrink-0 ml-4">Автор: {assembly.user.name}</span>
            </div>

            {assembly.description && (
                <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{assembly.description}</p>
                </div>
            )}
            
           

            <div className="grid grid-cols-1 md:grid-cols-[550px_1fr] gap-8">
                <PeripheralPreview assembly={assembly} />
                <div className="bg-[#3A4750] p-6 rounded-2xl flex flex-col">
                    <h4 className="font-dela text-lg mb-4 text-center text-white">Системный блок</h4>
                    
                    <ul className="space-y-3 font-days text-sm flex-grow">
                        {pcComponents.map((component) => (
                            <li key={component.id} className="flex justify-between">
                                <span className="text-white">{component.category.name}:</span>
                                <span className="text-right font-semibold text-gray-400">{getCleanName(component.name)}</span>
                            </li>
                        ))}
                    </ul>
                    {compatibilityErrors && compatibilityErrors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                            <h3 className="font-bold text-sm mb-1 text-red-300">Проблемы совместимости:</h3>
                            <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
                                {compatibilityErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="text-center font-dela text-xl mt-4 border-t-2 border-gray-700 pt-4 text-white flex justify-between items-center">
                        {showActions ? (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <button onClick={handleLike} disabled={isProcessingLike} className="transition-transform duration-150 ease-in-out hover:scale-110 active:scale-95 disabled:opacity-50">
                                        {isLiked ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-red-500">
                                                <path d="M11.645 20.91l-1.06-1.06C6.417 15.688 2.25 12.164 2.25 8.25 2.25 5.322 4.572 3 7.5 3c1.74 0 3.41.81 4.5 2.088C13.09 3.81 14.76 3 16.5 3c2.928 0 5.25 2.322 5.25 5.25 0 3.914-4.167 7.438-8.335 11.59L12.91 20.91a.75.75 0 01-1.06 0l-.205-.199z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-500 hover:text-red-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                            </svg>
                                        )}
                                    </button>
                                    <span className="text-lg text-gray-400">{likeCount}</span>
                                </div>
                                <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-500 hover:text-gray-300">
                                        <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.352 0 9.75-2.91 9.75-6.5S17.352 8.25 12 8.25 2.25 11.16 2.25 14.75c0 1.32.512 2.555 1.357 3.544.11.121.21.242.308.365a6.708 6.708 0 0 1 .88-1.015Z" clipRule="evenodd" />
                                        <path d="M4.06 21.938A9.75 9.75 0 0 1 2.25 14.75c0-4.322 4.363-7.826 9.75-7.826s9.75 3.504 9.75 7.826-4.363 7.826-9.75 7.826c-.843 0-1.67-.09-2.473-.262a9.703 9.703 0 0 0-1.62-.433c-.39-.104-.79-.215-1.19-.336a9.712 9.712 0 0 0-1.62-.433 9.703 9.703 0 0 0-1.191-.336c-.398-.121-.794-.25-1.19-.386a9.68 9.68 0 0 0-1.04-.37c.058.15.115.3.17.452.056.152.11.304.164.456.054.152.107.304.16.455a9.678 9.678 0 0 0 .88 1.015Z" />
                                    </svg>
                                    <span className="text-lg text-gray-400">{assembly.comments_count}</span>
                                </button>
                                
                            </div>
                            
                        ) : (
                            <div />
                        )}
                        <div>
                            <span>Стоимость: </span>
                            <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
                        </div>
                    </div>
                </div>
            </div>
            {showActions && showComments && (<CommentSection assemblyId={assembly.id} />)}
        </div>
    );
}