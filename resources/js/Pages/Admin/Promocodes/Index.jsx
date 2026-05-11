import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function PromocodesIndex() {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        code: '',
        type: 'percent',
        value: '',
        min_order_amount: '',
        usage_limit: '',
        valid_until: '',
        is_active: true,
        category_id: '',
        restricted_user_id: '',
        first_order_only: false,
        admin_only: false,
    });

    useEffect(() => {
        axios.get('/api/categories').then((res) => setCategories(res.data || [])).catch(() => setCategories([]));
    }, []);

    const fetchList = (url = '/api/admin/promocodes') => {
        setIsLoading(true);
        axios
            .get(url, { params: { search } })
            .then((response) => {
                setItems(response.data.data || []);
                const { data: _rows, ...meta } = response.data;
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

    const resetForm = () =>
        setForm({
            code: '',
            type: 'percent',
            value: '',
            min_order_amount: '',
            usage_limit: '',
            valid_until: '',
            is_active: true,
            category_id: '',
            restricted_user_id: '',
            first_order_only: false,
            admin_only: false,
        });

    const submit = () => {
        if (!canSubmit) return;
        const restrictedId = String(form.restricted_user_id || '').trim();
        axios
            .post('/api/admin/promocodes', {
                code: String(form.code || '').trim(),
                type: form.type,
                value: Number(form.value),
                min_order_amount: form.min_order_amount === '' ? null : Number(form.min_order_amount),
                usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
                valid_until: form.valid_until === '' ? null : form.valid_until,
                is_active: !!form.is_active,
                category_id: form.category_id === '' ? null : Number(form.category_id),
                restricted_user_id: restrictedId === '' ? null : Number(restrictedId),
                first_order_only: !!form.first_order_only,
                admin_only: !!form.admin_only,
            })
            .then(() => {
                resetForm();
                fetchList();
            })
            .catch((error) => {
                const msg = error?.response?.data?.message;
                const errs = error?.response?.data?.errors;
                alert(msg || (errs ? JSON.stringify(errs) : 'Не удалось создать промокод.'));
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

    const ruleBadges = (p) => {
        const tags = [];
        if (p.category_id && p.category?.name) {
            tags.push({ key: 'cat', label: `Категория: ${p.category.name}`, className: 'bg-sky-100 text-sky-900' });
        }
        if (p.restricted_user_id) {
            tags.push({
                key: 'user',
                label: `Только пользователь #${p.restricted_user_id}`,
                className: 'bg-violet-100 text-violet-900',
            });
        }
        if (p.first_order_only) {
            tags.push({ key: 'first', label: 'Только 1-й заказ', className: 'bg-amber-100 text-amber-900' });
        }
        if (p.admin_only) {
            tags.push({ key: 'adm', label: 'Только админы', className: 'bg-slate-200 text-slate-900' });
        }
        if (!tags.length) {
            return <span className="text-xs text-gray-500">Без ограничений</span>;
        }
        return (
            <div className="flex flex-wrap gap-1 max-w-xs">
                {tags.map((t) => (
                    <span key={t.key} title={t.label} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${t.className}`}>
                        {t.label}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <AdminLayout title="Админка - Промокоды" active="promocodes">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-2">Промокоды</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Умные правила: скидка только по категории (с корзины считается сумма позиций этой категории), персональный код (ID пользователя), только первый заказ, только администраторы.
                    Минимальная сумма заказа проверяется по <strong>полной</strong> корзине.
                </p>

                <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-4">
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
                            placeholder="Мин. сумма корзины ₽"
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                        <input
                            value={form.usage_limit}
                            onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
                            placeholder="Лимит (опц.)"
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Категория для скидки</label>
                            <select
                                value={form.category_id}
                                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                            >
                                <option value="">Вся корзина</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Только пользователь (ID)</label>
                            <input
                                type="number"
                                min="1"
                                value={form.restricted_user_id}
                                onChange={(e) => setForm((p) => ({ ...p, restricted_user_id: e.target.value }))}
                                placeholder="Не указано"
                                className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                            />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap gap-4 items-center pt-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!form.first_order_only}
                                    onChange={(e) => setForm((p) => ({ ...p, first_order_only: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                Только первый заказ
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!form.admin_only}
                                    onChange={(e) => setForm((p) => ({ ...p, admin_only: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                Только админы
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
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
                        <div className="md:col-span-3 flex gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={submit}
                                disabled={!canSubmit}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                                    canSubmit ? 'bg-[#08004E] hover:bg-[#060038] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Создать
                            </button>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Поиск по коду"
                                className="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                            />
                            <button
                                type="button"
                                onClick={() => fetchList()}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-md text-sm font-semibold px-4 py-2 transition"
                            >
                                Найти
                            </button>
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
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Условия</th>
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
                                        <td className="px-4 py-3 text-sm">{ruleBadges(p)}</td>
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
                                            <span
                                                className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {p.is_active ? 'Активен' : 'Отключен'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right space-x-3">
                                            <button type="button" onClick={() => toggleActive(p.id)} className="text-[#08004E] hover:underline">
                                                {p.is_active ? 'Отключить' : 'Включить'}
                                            </button>
                                            <button type="button" onClick={() => destroy(p.id)} className="text-red-600 hover:underline">
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
