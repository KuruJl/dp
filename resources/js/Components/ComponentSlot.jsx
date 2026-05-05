// resources/js/Components/ComponentSlot.jsx
import React from 'react';
import plusIconUrl from '@/Components/DeskPlaceholders/PlusPlaceholder.svg';

export default function ComponentSlot({
    categorySlug,
    displayName,
    selectedItem,
    placeholderUrl,
    imagePosition,
    buttonPosition,
    onAddClick,
    selectedImageUrl, 
}) {
    return (
        <>
            {/* --- Блок для отображения картинки/плейсхолдера --- */}
            <div className={`absolute ${imagePosition}`}>
                {
                    // Если товар НЕ выбран, показываем SVG-контур
                    !selectedItem && (
                        <img src={placeholderUrl} alt={`Контур для ${displayName}`} className="w-full h-full opacity-50" />
                    )
                }
                {
                    // Если товар ВЫБРАН, показываем его красивую WEBP-картинку
                    selectedItem && (
                        <img 
                            src={selectedImageUrl} 
                            alt={selectedItem.name} 
                            className="w-full h-full object-contain   transition-all duration-300
                            hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                        />
                    )
                }
            </div>
            
            
            {
                !selectedItem && (
                    <button
                        onClick={() => onAddClick({ categorySlug, displayName })}
                        className={`absolute ${buttonPosition}`}
                        title={`Выбрать ${displayName}`}
                        aria-label={`Выбрать ${displayName}`}
                    >
                        {/* Внутри кнопки должна быть иконка плюса! */}
                        <img src={plusIconUrl} className="w-full h-full hover:scale-110 transition-transform" />
                    </button>
                )
            }
        </>
    );
}