import React from 'react';

const CASE_OUTLINE_IMAGE = '/images/korpus.png';
const CASE_SELECTED_IMAGE = '/images/korpus-selected.png';

export default function Configurator2DView({ componentSlots, assembly, onSlotClick }) {
    const hasCaseSelected = !!assembly?.korpusa;

    return (
        <div className="w-full bg-black rounded-xl overflow-hidden shadow-inner p-6 border border-gray-300">
            <div className="relative mx-auto w-full">
                <img
                    src={hasCaseSelected ? CASE_SELECTED_IMAGE : CASE_OUTLINE_IMAGE}
                    alt="Корпус ПК"
                    className={`w-full h-auto object-contain pointer-events-none select-none relative z-0 transition-opacity duration-300 ${
                        hasCaseSelected ? 'opacity-100' : 'opacity-50'
                    }`}
                />

                {componentSlots.map((slot) => {
                    const slotKey = slot.slotKey || slot.categorySlug;
                    const selectedItem = assembly[slotKey];
                    const isCase = slotKey === 'korpusa';

                    if (isCase) {
                        return (
                            <button
                                key={`btn-${slotKey}`}
                                onClick={() => onSlotClick(slot)}
                                className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-md z-20 ${
                                    selectedItem
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-black border-white text-white hover:bg-white hover:text-black'
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
                            <div className={`absolute z-10 ${slot.imagePosition} flex items-center justify-center pointer-events-none`}>
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

                            <button
                                onClick={() => onSlotClick(slot)}
                                className={`absolute z-20 ${slot.buttonPosition} rounded-full border flex items-center justify-center transition-all shadow-md ${
                                    selectedItem
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-black border-white text-white hover:bg-white hover:text-black'
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

