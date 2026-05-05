import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) {
        return null;
    }

    return (

        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >

            <div
                className="w-full max-w-7xl bg-white text-black rounded-xl shadow-2xl flex flex-col max-h-[85vh] border border-gray-200"
                onClick={e => e.stopPropagation()}
            >
                {/* --- 3. Шапка окна --- */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl md:text-2xl font-extrabold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-[#08004E] text-3xl leading-none transition-colors"
                    >
                        &times;
                    </button>
                </div>




                <div className="p-6 max-w-7xl overflow-y-auto">
                    {children}
                </div>



            </div>
        </div>
    );
}