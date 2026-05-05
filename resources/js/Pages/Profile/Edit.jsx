import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import ProfileSidebar from '@/Components/ProfileSidebar';
import { formatRuPhone, ruPhoneToDigits } from '@/utils/phoneMask';

export default function Edit() {
    // Получаем данные текущего пользователя из пропсов Laravel
    const { auth } = usePage().props;
    const user = auth.user;

    // Инициализируем форму с текущими данными пользователя
    const { data, setData, patch, transform, processing, errors, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone ? formatRuPhone(user.phone) : '',
    });

    const submit = (e) => {
        e.preventDefault();
        transform((payload) => ({
            ...payload,
            phone: ruPhoneToDigits(payload.phone),
        }));
        patch('/profile', { preserveScroll: true });
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Личный кабинет" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12">
                    Личный кабинет
                </h1>

                <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                    
                    <ProfileSidebar user={user} activeTab="profile" />

                    {/* ПРАВАЯ КОЛОНКА (Форма редактирования) */}
                    <section className="flex-1 w-full bg-white rounded-xl p-6 md:p-10 border border-gray-200 shadow-sm min-w-0">
                        
                        <form onSubmit={submit} className="flex flex-col gap-8">
                            
                            {/* Сетка инпутов (Имя и Телефон) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Ваше имя</label>
                                    <input 
                                        type="text" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        placeholder="Введите имя" 
                                        className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] transition-colors" 
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Номер телефона</label>
                                    <input 
                                        type="tel" 
                                        value={data.phone} 
                                        onChange={(e) => setData('phone', formatRuPhone(e.target.value))} 
                                        placeholder="8(910)123-12-12" 
                                        inputMode="tel"
                                        className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] transition-colors" 
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            {/* Сетка инпутов (Почта и Пароль) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Электронная почта</label>
                                    <input 
                                        type="email" 
                                        value={data.email} 
                                        onChange={e => setData('email', e.target.value)} 
                                        placeholder="Введите почту" 
                                        className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] transition-colors" 
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                {/* Кнопка изменения пароля (визуально выровнена с инпутом) */}
                                <div>
                                    <button 
                                        type="button" 
                                        onClick={() => alert('Здесь будет открываться модальное окно смены пароля')}
                                        className="w-full h-[46px] bg-[#08004E] text-white font-bold rounded-md hover:bg-opacity-90 active:scale-[0.98] transition-all shadow-sm"
                                    >
                                        Изменить пароль
                                    </button>
                                </div>
                            </div>

                            {/* Подвал формы с кнопкой сохранения */}
                            <div className="pt-6 mt-2 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="w-full sm:w-auto bg-[#08004E] text-white font-bold py-3.5 px-8 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
                                >
                                    {processing ? 'Сохранение...' : 'Сохранить изменения'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.post('/logout')}
                                    className="w-full sm:w-auto bg-white text-gray-700 font-bold py-3.5 px-8 rounded-lg border border-gray-300 hover:border-red-400 hover:text-red-600 transition"
                                >
                                    Выйти
                                </button>

                                {/* Уведомление об успешном сохранении */}
                                {recentlySuccessful && (
                                    <span className="text-green-600 font-medium text-sm animate-pulse">
                                        Данные успешно сохранены!
                                    </span>
                                )}
                            </div>

                        </form>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}