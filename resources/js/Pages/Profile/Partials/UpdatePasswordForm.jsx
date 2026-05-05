// resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx

import { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

// Общие классы для стилизации
const labelClasses = "block font-medium text-sm text-gray-300";
const inputClasses = "mt-1 block w-full bg-[#3A4750] border-gray-600 focus:border-sky-500 focus:ring-sky-500 text-white rounded-md shadow-sm";
const buttonClasses = "px-6 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition disabled:opacity-50";

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-2xl font-dela text-white">Обновить пароль</h2>
                <p className="mt-1 text-sm text-gray-400">
                    Убедитесь, что ваш аккаунт использует длинный, случайный пароль, чтобы оставаться в безопасности.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <label htmlFor="current_password" className={labelClasses}>Текущий пароль</label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className={inputClasses}
                        autoComplete="current-password"
                    />
                    {errors.current_password && <p className="text-sm text-red-500 mt-2">{errors.current_password}</p>}
                </div>

                <div>
                    <label htmlFor="password" className={labelClasses}>Новый пароль</label>
                    <input
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className={inputClasses}
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="text-sm text-red-500 mt-2">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className={labelClasses}>Подтвердите пароль</label>
                    <input
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className={inputClasses}
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && <p className="text-sm text-red-500 mt-2">{errors.password_confirmation}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <button className={buttonClasses} disabled={processing}>
                        Сохранить
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-400">Сохранено.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}