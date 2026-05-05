import React from 'react';

export default function ProductCard({ component, onSelect }) {
    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val || 0);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-lg hover:border-gray-300 transition-all duration-300 group h-full">
            <div className="h-24 w-full mb-3 flex items-center justify-center overflow-hidden p-2">
                <img 
                    src={component.image_url || '/images/default_product.png'} 
                    alt={component.name} 
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300 mix-blend-multiply"
                />
            </div>
            
            <h4 className="text-xs font-bold text-black leading-snug line-clamp-2 mb-2 flex-grow">
                {component.name}
            </h4>
            
            <div className="mt-auto">
                <div className="text-sm font-extrabold text-black mb-3">
                    {formatPrice(component.price)} ₽
                </div>
                <button 
                    onClick={() => onSelect(component)}
                    className="w-full bg-white border-2 border-[#08004E] text-[#08004E] font-bold text-xs py-2 rounded-lg hover:bg-[#08004E] hover:text-white active:scale-[0.98] transition-all shadow-sm"
                >
                    Выбрать
                </button>
            </div>
        </div>
    );
}