import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function PromocodesIndex() {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        code: '',
        type: 'percent',
        value: '',
        min_order_amount: '',
        usage_limit: '',
        valid_until: '',
        is_active: true,
    });

    const fetchList = (url = '/api/admin/promocodes') => {
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

    const canSubmit = useMemo(() => {
        return String(form.code || '').trim().length > 0 && String(form.value || '').trim().length > 0;
    }, [form.code, form.value]);

    const submit = () => {
        if (!canSubmit) return;
        axios
            .post('/api/admin/promocodes', {
                code: String(form.code || '').trim(),
                type: form.type,
                value: Number(form.value),
                min_order_amount: form.min_order_amount === '' ? null : Number(form.min_order_amount),
                usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
                valid_until: form.valid_until === '' ? null : form.valid_until,
                is_active: !!form.is_active,
            })
            .then(() => {
                setForm({
                    code: '',
                    type: 'percent',
                    value: '',
                    min_order_amount: '',
                    usage_limit: '',
                    valid_until: '',
                    is_active: true,
                });
                fetchList();
            })
            .catch((error) => {
                alert(error?.response?.data?.message || 'Не удалось создать промокод.');
            });
    };

    const toggleActive = (id) => {
        axios
            .patch(`/api/admin/promocodes/${id}/toggle-active`)
            .then(() => fetchList(pagination.path ? `${pagination.path}?page=${pagination.current_page}` : '/api/admin/promocodes'));
    };

    const destroy = (id) => {
        if (!window.confirm('Удалить промокод?')) return;
        axios
            .delete(`/api/admin/promocodes/${id}`)
            .then(() => fetchList(pagination.path ? `${pagination.path}?page=${pagination.current_page}` : '/api/admin/promocodes'))
            .catch(() => alert('Не удалось удалить промокод.'));
    };

    return (
        <AdminLayout title="Админка - Промокоды" active="promocodes">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Промокоды</h2>

                <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <input
                            value={form.code}
                            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                            placeholder="CODE"
                            className="md:col-span-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <select
                            value={form.type}
                            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        >
                            <option value="percent">% скидка</option>
                            <option value="fixed">₽ скидка</option>
                        </select>
                        <input
                            value={form.value}
                            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                            placeholder={form.type === 'percent' ? 'Напр. 10' : 'Напр. 500'}
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.min_order_amount}
                            onChange={(e) => setForm((p) => ({ ...p, min_order_amount: e.target.value }))}
                            placeholder="Мин. сумма (опц.)"
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.usage_limit}
                            onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
                            placeholder="Лимит (опц.)"
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3 items-center">
                        <div className="md:col-span-2 flex items-center gap-3">
                            <input
                                id="promo_active"
                                type="checkbox"
                                checked={!!form.is_active}
                                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            <label htmlFor="promo_active" className="text-sm text-gray-800 font-semibold">
                                Активен
                            </label>
                        </div>
                        <input
                            type="date"
                            value={form.valid_until}
                            onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))}
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <div className="md:col-span-3 flex gap-2">
                            <button
                                onClick={submit}
                                disabled={!canSubmit}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition w-full md:w-auto ${
                                    canSubmit ? 'bg-[#08004E] hover:bg-[#060038] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Создать
                            </button>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Поиск по коду"
                                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                                />
                                <button
                                    onClick={() => fetchList()}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-md text-sm font-semibold px-4 py-2 transition"
                                >
                                    Найти
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка промокодов...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Код</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Тип</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Значение</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Мин. сумма</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Лимит</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Использований</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">До</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Статус</th>
                                    <th className="px-4 py-3 text-right text-xs uppercase font-bold text-gray-500">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-black font-extrabold">{p.code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.type === 'percent' ? 'percent' : 'fixed'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {p.type === 'percent' ? `${Number(p.value || 0)}%` : `${Number(p.value || 0).toLocaleString('ru-RU')} ₽`}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {p.min_order_amount ? `${Number(p.min_order_amount).toLocaleString('ru-RU')} ₽` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.usage_limit || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.used_count || 0}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.valid_until ? String(p.valid_until).slice(0, 10) : '—'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {p.is_active ? 'Активен' : 'Отключен'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right space-x-3">
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

