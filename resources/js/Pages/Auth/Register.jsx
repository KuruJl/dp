import React from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Новые классы в стиле ASL SHOP
    const inputClasses = "w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] transition-colors";
    const labelClasses = "block text-sm font-bold text-black mb-2";

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Регистрация" />
            <Header />

            <main className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md p-8 sm:p-10 bg-white shadow-sm border border-gray-200 rounded-2xl">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-black mb-8">
                        Регистрация
                    </h2>

                    <form onSubmit={submit} className="flex flex-col gap-5">
                        
                        {/* Поле Имя */}
                        <div>
                            <label htmlFor="name" className={labelClasses}>Ваше имя</label>
                            <input
                                id="name"
                                name="name"
                                value={data.name}
                                className={inputClasses}
                                placeholder="Иван Иванов"
                                autoComplete="name"
                                autoFocus
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-2 font-medium">{errors.name}</p>}
                        </div>

                        {/* Поле Email */}
                        <div>
                            <label htmlFor="email" className={labelClasses}>Электронная почта</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className={inputClasses}
                                placeholder="name@example.com"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="text-sm text-red-500 mt-2 font-medium">{errors.email}</p>}
                        </div>

                        {/* Поле Пароль */}
                        <div>
                            <label htmlFor="password" className={labelClasses}>Пароль</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className={inputClasses}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && <p className="text-sm text-red-500 mt-2 font-medium">{errors.password}</p>}
                        </div>

                        {/* Поле Подтверждение пароля */}
                        <div>
                            <label htmlFor="password_confirmation" className={labelClasses}>Подтвердите пароль</label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className={inputClasses}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            {errors.password_confirmation && <p className="text-sm text-red-500 mt-2 font-medium">{errors.password_confirmation}</p>}
                        </div>

                        {/* Кнопка Регистрация */}
                        <button 
                            className="w-full bg-[#08004E] text-white font-bold py-3.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md mt-4" 
                            disabled={processing}
                        >
                            {processing ? 'Регистрация...' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    {/* Разделитель и кнопки соцсетей */}
                    <div className="mt-8 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">Или продолжите с помощью</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center mt-6 gap-4">
                            <a 
                                href={route('socialite.redirect', { provider: 'google' })}
                                className="flex-1 py-3 border-2 flex justify-center items-center gap-2 border-gray-200 bg-white rounded-xl text-black font-bold hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <img className="w-5 h-5" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
                                <span>Google</span>
                            </a>
                            
                            <a 
                                href={route('socialite.redirect', { provider: 'yandex' })}
                                className="flex-1 py-3 border-2 flex justify-center items-center gap-2 border-gray-200 bg-white rounded-xl text-black font-bold hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <img className="w-5 h-5" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Yandex_icon.svg/1024px-Yandex_icon.svg.png" loading="lazy" alt="yandex logo" />
                                <span>Яндекс</span>
                            </a>
                        </div>
                    </div>

                    {/* Ссылка на Вход */}
                    <p className="text-center text-sm text-gray-600 mt-8 font-medium">
                        Уже есть аккаунт?{' '}
                        <Link href={route('login')} className="text-[#08004E] font-bold hover:underline">
                            Войти
                        </Link>
                    </p>

                </div>
            </main>
            
            <Footer />
        </div>
    );
}