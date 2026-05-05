// resources/js/Components/AssemblyListComponent.jsx
import React from 'react';

const getCleanName = (fullName) => {
    if (!fullName) return '';
    const bracketIndex = fullName.indexOf('[');
    return bracketIndex !== -1 ? fullName.substring(0, bracketIndex).trim() : fullName;
};

export default function AssemblyListComponent({ assembly, onComponentClear }) {
    
    console.log("--- AssemblyListComponent ЗАПУЩЕН ---");
    console.log("Получена сборка (assembly):", assembly);
    
    const allComponents = Object.values(assembly).filter(c => c !== null);
    
    const pcComponents = allComponents.filter(component => {
        console.log(`--- Проверяем: ${component.name} ---`);

        const hasComponent = !!component;
        console.log("1. Компонент существует?", hasComponent);

        const hasCategory = hasComponent && !!component.category;
        console.log("2. У него есть 'category'?", hasCategory);

        if (hasCategory) {
            const hasType = typeof component.category.type !== 'undefined';
            console.log("3. В 'category' есть 'type'?", hasType);
            
            if (hasType) {
                const isComponentType = component.category.type === 'component';
                console.log(`4. Тип ('${component.category.type}') равен 'component'?`, isComponentType);
                
                if (isComponentType) {
                    console.log(">>> РЕШЕНИЕ: ОСТАВИТЬ ✅");
                    return true;
                }
            }
        }
        
        console.log(">>> РЕШЕНИЕ: ОТФИЛЬТРОВАТЬ ❌");
        return false;
    });

    console.log(`Итоговый массив pcComponents (длина: ${pcComponents.length}):`, pcComponents);

    const totalPrice = allComponents.reduce((sum, component) => sum + component.price, 0);

    return (
        <div className="space-y-4 text-white">
            <div className="bg-[#380000]/60 p-6 rounded-2xl">
                <h3 className="font-dela text-xl mb-4 text-center">Системный блок</h3>
                <ul className="space-y-2 text-sm">
                    {pcComponents.map(component => (
                        <li key={component.id} className="flex justify-between items-center group p-2 -m-2 rounded-md hover:bg-white/10">
                            {/* ... */}
                        </li>
                    ))}
                    {pcComponents.length === 0 && (
                        <li className="text-gray-500 text-center">Компоненты не выбраны</li>
                    )}
                </ul>
            </div>
            <div className="text-center font-dela text-2xl">
                <span>Итого: </span>
                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
        </div>
    );
}