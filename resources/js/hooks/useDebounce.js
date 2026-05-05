import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Устанавливаем таймер, который обновит значение через 'delay' мс
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Сбрасываем таймер, если значение изменилось (пользователь продолжает печатать)
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}