import React from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Новые классы в стиле ASL SHOP
    const inputClasses = "w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] transition-colors";
    const labelClasses = "block text-sm font-bold text-black mb-2";

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Вход в аккаунт" />
            <Header />

            <main className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md p-8 sm:p-10 bg-white shadow-sm border border-gray-200 rounded-2xl">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-black mb-8">
                        Авторизация
                    </h2>

                    {status && (
                        <div className="mb-6 text-sm font-bold text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="flex flex-col gap-6">
                        
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
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
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
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                             {errors.password && <p className="text-sm text-red-500 mt-2 font-medium">{errors.password}</p>}
                        </div>

                        {/* Запомнить меня и Забыли пароль */}
                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="w-4 h-4 rounded border-gray-400 text-[#08004E] shadow-sm focus:ring-[#08004E] cursor-pointer"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="ms-2 text-sm text-gray-600 font-medium group-hover:text-black transition">Запомнить меня</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-[#08004E] font-bold hover:underline"
                                >
                                    Забыли пароль?
                                </Link>
                            )}
                        </div>

                        {/* Кнопка входа */}
                        <button 
                            className="w-full bg-[#08004E] text-white font-bold py-3.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md mt-2" 
                            disabled={processing}
                        >
                            {processing ? 'Вход...' : 'Войти'}
                        </button>
                    </form>

                    {/* Разделитель и кнопки соцсетей */}
                    <div className="mt-8 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">Или войдите с помощью</span>
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
                    
                    {/* Ссылка на регистрацию */}
                    <p className="text-center text-sm text-gray-600 mt-8 font-medium">
                        Нет аккаунта?{' '}
                        <Link href={route('register')} className="text-[#08004E] font-bold hover:underline">
                            Зарегистрируйтесь
                        </Link>
                    </p>

                </div>
            </main>
            
            <Footer />
        </div>
    );
}