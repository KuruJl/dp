// resources/js/Pages/Profile/Partials/DeleteUserForm.jsx

import { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

// Общие классы для стилизации
const inputClasses = "mt-1 block w-full bg-[#3A4750] border-gray-600 focus:border-sky-500 focus:ring-sky-500 text-white rounded-md shadow-sm";
const dangerButtonClasses = "px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition disabled:opacity-50";
const secondaryButtonClasses = "px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition disabled:opacity-50";

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-2xl font-dela text-white">Удаление аккаунта</h2>
                <p className="mt-1 text-sm text-gray-400">
                    После удаления вашего аккаунта все его ресурсы и данные будут удалены безвозвратно.
                </p>
            </header>

            <button onClick={confirmUserDeletion} className={dangerButtonClasses}>
                Удалить аккаунт
            </button>

            <Modal isOpen={confirmingUserDeletion} onClose={closeModal} title="Вы уверены, что хотите удалить аккаунт?">
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-white">
                        Это действие необратимо. Пожалуйста, введите ваш пароль для подтверждения.
                    </h2>

                    <div className="mt-6">
                        <label htmlFor="password-delete" className="sr-only">Пароль</label>
                        <input
                            id="password-delete"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={inputClasses}
                            placeholder="Пароль"
                        />
                        {errors.password && <p className="text-sm text-red-500 mt-2">{errors.password}</p>}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={closeModal} className={secondaryButtonClasses}>
                            Отмена
                        </button>

                        <button className={`${dangerButtonClasses} ml-3`} disabled={processing}>
                            Удалить аккаунт
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}