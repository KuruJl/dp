import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        "./resources/js/**/*.js",
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                dela: ['"Dela Gothic One"', 'sans-serif'], 
                days: ['"Days One"', 'sans-serif'],
                man:['Manrope', ...defaultTheme.fontFamily.sans], 
            },
            color:{
                 'main': '#DEDEDE', // <-- ДОБАВИЛИ СВОЙ ЦВЕТ
                'brand-blue': '#08004E',
            }
        },
    },

    plugins: [forms],
};
