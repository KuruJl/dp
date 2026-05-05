// resources/js/hooks/usePersistentState.js
import { useState, useEffect } from 'react';

function usePersistentState(key, defaultValue) {
    const [state, setState] = useState(() => {
        let storedValue;
        try {
            // 1. Пытаемся получить данные из localStorage
            storedValue = localStorage.getItem(key);
            
            // 2. Если что-то есть, ПЫТАЕМСЯ это распарсить.
            // Если не получится (битый JSON), блок catch поймает ошибку.
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            // 3. Если произошла ошибка (например, невалидный JSON),
            // выводим сообщение в консоль и возвращаем значение по умолчанию.
            console.error(`Ошибка при чтении localStorage для ключа "${key}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            // Сохраняем в localStorage, тоже с проверкой на всякий случай
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Ошибка при записи в localStorage для ключа "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default usePersistentState;