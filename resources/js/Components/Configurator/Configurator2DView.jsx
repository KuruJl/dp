import React from 'react';

export default function Configurator2DView({ componentSlots, assembly, onSlotClick }) {
    return (
        <div className="w-full bg-[#08004E] rounded-xl overflow-hidden shadow-inner p-6 border border-gray-300">
            <div className="relative mx-auto w-full">
                <img
                    src="/images/korpus.png"
                    alt="Схема корпуса ПК"
                    className="w-full h-auto opacity-50 pointer-events-none select-none"
                />

                {componentSlots.map((slot) => {
                    const slotKey = slot.slotKey || slot.categorySlug;
                    const selectedItem = assembly[slotKey];
                    const isCase = slotKey === 'korpusa';
                    const isRamSlot = slot.categorySlug === 'operativnaia-pamiat';

                    if (isCase) {
                        return (
                            <button
                                key={`btn-${slotKey}`}
                                onClick={() => onSlotClick(slot)}
                                className={`absolute ${slot.buttonPosition} rounded-full border-2 flex items-center justify-center transition-all shadow-md z-20 ${
                                    selectedItem
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-[#08004E] border-white text-white hover:bg-white hover:text-[#08004E]'
                                }`}
                                title={slot.displayName}
                            >
                                {selectedItem ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                )}
                            </button>
                        );
                    }

                    return (
                        <React.Fragment key={`map-${slotKey}`}>
                            <div className={`absolute ${slot.imagePosition} flex items-center justify-center pointer-events-none`}>
                                <img
                                    src={slot.placeholderUrl}
                                    alt={selectedItem ? slot.displayName : 'заглушка'}
                                    className={`max-w-full max-h-full object-contain pointer-events-auto cursor-pointer transition-all duration-300 ${
                                        selectedItem
                                            ? 'opacity-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] hover:scale-105'
                                            : 'opacity-40 hover:opacity-80 transition-opacity'
                                    }`}
                                    onClick={() => onSlotClick(slot)}
                                />
                            </div>

                            {isRamSlot && selectedItem && slot.secondaryImagePosition && (
                                <div className={`absolute ${slot.secondaryImagePosition} flex items-center justify-center pointer-events-none`}>
                                    <img
                                        src={slot.placeholderUrl}
                                        alt={`${slot.displayName} #2`}
                                        className="max-w-full max-h-full object-contain pointer-events-none transition-all duration-300 opacity-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]"
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => onSlotClick(slot)}
                                className={`absolute ${slot.buttonPosition} rounded-full border flex items-center justify-center transition-all z-20 shadow-md ${
                                    selectedItem
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-[#08004E] border-white text-white hover:bg-white hover:text-[#08004E]'
                                }`}
                                title={slot.displayName}
                            >
                                {selectedItem ? (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

