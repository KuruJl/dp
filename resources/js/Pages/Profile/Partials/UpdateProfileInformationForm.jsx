// resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx

import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

// Общие классы для стилизации
const labelClasses = "block font-medium text-sm text-gray-300";
const inputClasses = "mt-1 block w-full bg-[#3A4750] border-gray-600 focus:border-sky-500 focus:ring-sky-500 text-white rounded-md shadow-sm";
const buttonClasses = "px-6 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition disabled:opacity-50";

export default function UpdateProfileInformationForm({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-2xl font-dela text-white">Информация профиля</h2>
                <p className="mt-1 text-sm text-gray-400">
                    Обновите информацию о своем профиле и адрес электронной почты.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <label htmlFor="name" className={labelClasses}>Имя</label>
                    <input
                        id="name"
                        className={inputClasses}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-2">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email" className={labelClasses}>Email</label>
                    <input
                        id="email"
                        type="email"
                        className={inputClasses}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-2">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-sm mt-2 text-gray-300">
                            Ваш email не подтвержден.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline text-sm text-gray-400 hover:text-gray-100 rounded-md ml-2"
                            >
                                Нажмите здесь, чтобы отправить письмо для подтверждения.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-medium text-sm text-green-400">
                                Новая ссылка для подтверждения была отправлена на ваш email.
                            </div>
                        )}
                    </div>
                )}

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