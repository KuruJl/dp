import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) {
        return null;
    }

    return (

        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]"
            onClick={onClose}
        >

            <div
                className="w-[calc(100%-1.5rem)] sm:w-full max-w-7xl mx-3 sm:mx-auto bg-white text-black rounded-xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[85vh] border border-gray-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 shrink-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold pr-2">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-[#08004E] text-3xl leading-none transition-colors"
                    >
                        &times;
                    </button>
                </div>




                <div className="p-4 sm:p-6 max-w-7xl overflow-y-auto flex-1 min-h-0">
                    {children}
                </div>



            </div>
        </div>
    );
}