// resources/js/app.jsx

import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'; // <-- Этот импорт у вас уже есть
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    
    // --- ЗАМЕНИТЕ ВЕСЬ БЛОК 'resolve' НА ЭТОТ ---
    resolve: (name) => {
        console.log("Inertia запросила страницу с именем:", name);
    
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        
        console.log("Vite нашел следующие файлы:", pages);
    
        const pagePath = `./Pages/${name}.jsx`;
        console.log("Мы пытаемся найти ключ:", pagePath);
    
        const page = pages[pagePath];
    
        if (!page) {
            // Если страница не найдена, выбрасываем ошибку с полезной информацией
            throw new Error(`Страница не найдена: ${pagePath}. Доступные страницы: ${Object.keys(pages).join(', ')}`);
        }
    
        console.log("Страница найдена, возвращаем ее default экспорт.");
        return page.default;
    },
    // ---------------------------------------------
    
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
            return;
        }

        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});