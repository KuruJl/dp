import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

const emptyForm = {
    id: null,
    city: '',
    address: '',
    name: '',
    working_hours: '',
    phone: '',
    is_active: true,
};

export default function PickupPointsIndex() {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(emptyForm);

    const fetchList = (url = '/api/admin/pickup-points') => {
        setIsLoading(true);
        axios
            .get(url, { params: { search } })
            .then((response) => {
                setItems(response.data.data || []);
                const { data, ...meta } = response.data;
                setPagination(meta);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchList();
    }, []);

    const canSubmit = useMemo(
        () => String(form.city || '').trim().length > 0 && String(form.address || '').trim().length > 0,
        [form.city, form.address]
    );

    const resetForm = () => setForm(emptyForm);

    const submit = () => {
        if (!canSubmit) return;
        const payload = {
            city: form.city.trim(),
            address: form.address.trim(),
            name: form.name?.trim() || null,
            working_hours: form.working_hours?.trim() || null,
            phone: form.phone?.trim() || null,
            is_active: !!form.is_active,
        };

        const request = form.id
            ? axios.patch(`/api/admin/pickup-points/${form.id}`, payload)
            : axios.post('/api/admin/pickup-points', payload);

        request
            .then(() => {
                resetForm();
                fetchList();
            })
            .catch((error) => alert(error?.response?.data?.message || 'Не удалось сохранить пункт выдачи.'));
    };

    const edit = (point) => {
        setForm({
            id: point.id,
            city: point.city || '',
            address: point.address || '',
            name: point.name || '',
            working_hours: point.working_hours || '',
            phone: point.phone || '',
            is_active: !!point.is_active,
        });
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleActive = (id) => {
        axios.patch(`/api/admin/pickup-points/${id}/toggle-active`).then(() => fetchList());
    };

    const destroy = (id) => {
        if (!window.confirm('Удалить пункт выдачи?')) return;
        axios
            .delete(`/api/admin/pickup-points/${id}`)
            .then(() => fetchList())
            .catch(() => alert('Не удалось удалить пункт выдачи.'));
    };

    return (
        <AdminLayout title="Админка - Пункты выдачи" active="pickup-points">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Пункты выдачи</h2>

                <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
                    <h3 className="text-lg font-bold text-black mb-3">
                        {form.id ? `Редактирование #${form.id}` : 'Создание нового пункта'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <input
                            value={form.city}
                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                            placeholder="Город *"
                            className="md:col-span-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.address}
                            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                            placeholder="Адрес *"
                            className="md:col-span-4 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Название (опц.)"
                            className="md:col-span-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.working_hours}
                            onChange={(e) => setForm((p) => ({ ...p, working_hours: e.target.value }))}
                            placeholder="Часы работы (напр. 10:00-21:00)"
                            className="md:col-span-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.phone}
                            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="Телефон"
                            className="md:col-span-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3 items-center">
                        <div className="md:col-span-2 flex items-center gap-3">
                            <input
                                id="pickup_active"
                                type="checkbox"
                                checked={!!form.is_active}
                                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            <label htmlFor="pickup_active" className="text-sm text-gray-800 font-semibold">
                                Активен (виден в корзине)
                            </label>
                        </div>
                        <div className="md:col-span-4 flex flex-wrap gap-2 justify-end">
                            {form.id && (
                                <button
                                    onClick={resetForm}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-md text-sm font-semibold px-4 py-2 transition"
                                >
                                    Отменить редактирование
                                </button>
                            )}
                            <button
                                onClick={submit}
                                disabled={!canSubmit}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                                    canSubmit ? 'bg-[#08004E] hover:bg-[#060038] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {form.id ? 'Сохранить' : 'Создать'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по городу или адресу"
                        className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                    />
                    <button
                        onClick={() => fetchList()}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-md text-sm font-semibold px-4 py-2 transition"
                    >
                        Найти
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка пунктов выдачи...</p>
                ) : items.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Пунктов выдачи пока нет.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Город</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Адрес</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Название</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">График</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Телефон</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Статус</th>
                                    <th className="px-4 py-3 text-right text-xs uppercase font-bold text-gray-500">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-black font-bold">{p.city}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.address}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.name || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.working_hours || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.phone || '—'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {p.is_active ? 'Активен' : 'Отключен'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right space-x-3">
                                            <button onClick={() => edit(p)} className="text-[#08004E] hover:underline">
                                                Изменить
                                            </button>
                                            <button onClick={() => toggleActive(p.id)} className="text-[#08004E] hover:underline">
                                                {p.is_active ? 'Отключить' : 'Включить'}
                                            </button>
                                            <button onClick={() => destroy(p.id)} className="text-red-600 hover:underline">
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
