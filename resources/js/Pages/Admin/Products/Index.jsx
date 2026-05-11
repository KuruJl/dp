import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

const emptyForm = () => ({
    name: '',
    slug: '',
    description: '',
    price: '',
    quantity: '',
    status: 'на модерации',
    category_id: '',
    manufacturer_id: '',
    new_manufacturer_name: '',
    rejection_reason: '',
    main_image_url: '',
    specs: [{ name: '', value: '' }],
});

export default function ProductsIndex() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [meta, setMeta] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categories, setCategories] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    const fetchList = (page = 1) => {
        setIsLoading(true);
        axios
            .get('/api/admin/products', { params: { search, status: statusFilter, page } })
            .then((response) => {
                const payload = response.data;
                setProducts(payload.data || []);
                const { data: _d, ...rest } = payload;
                setPagination(rest);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    total: payload.total,
                });
            })
            .finally(() => setIsLoading(false));
    };

    const loadMeta = () => {
        axios.get('/api/admin/products/form-meta').then((res) => {
            setCategories(res.data.categories || []);
            setManufacturers(res.data.manufacturers || []);
        });
    };

    useEffect(() => {
        loadMeta();
        fetchList(1);
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const slugFromName = (name) =>
        String(name || '')
            .toLowerCase()
            .trim()
            .replace(/[^\w\u0400-\u04FF]+/g, '-')
            .replace(/^-+|-+$/g, '');

    const openEdit = (id) => {
        axios.get(`/api/admin/products/${id}`).then((res) => {
            const p = res.data.product;
            const specs =
                p.specs && p.specs.length > 0 ? p.specs.map((s) => ({ name: s.name, value: s.value })) : [{ name: '', value: '' }];
            setEditingId(id);
            setForm({
                name: p.name || '',
                slug: p.slug || '',
                description: p.description || '',
                price: String(p.price ?? ''),
                quantity: String(p.quantity ?? ''),
                status: p.status || 'на модерации',
                category_id: String(p.category_id ?? ''),
                manufacturer_id: p.manufacturer_id ? String(p.manufacturer_id) : '',
                new_manufacturer_name: '',
                rejection_reason: p.rejection_reason || '',
                main_image_url: p.main_image_url || '',
                specs,
            });
            setModalOpen(true);
        });
    };

    const closeModal = () => setModalOpen(false);

    const updateSpecRow = (idx, key, val) => {
        setForm((prev) => {
            const specs = [...prev.specs];
            specs[idx] = { ...specs[idx], [key]: val };
            return { ...prev, specs };
        });
    };

    const addSpecRow = () => setForm((prev) => ({ ...prev, specs: [...prev.specs, { name: '', value: '' }] }));

    const removeSpecRow = (idx) =>
        setForm((prev) => ({
            ...prev,
            specs: prev.specs.filter((_, i) => i !== idx).length ? prev.specs.filter((_, i) => i !== idx) : [{ name: '', value: '' }],
        }));

    const payloadFromForm = () => {
        const specs = form.specs.filter((s) => String(s.name).trim() && String(s.value).trim());
        const base = {
            name: form.name.trim(),
            slug: form.slug.trim() || slugFromName(form.name),
            description: form.description.trim() || null,
            price: Number(form.price),
            quantity: parseInt(form.quantity, 10),
            status: form.status,
            category_id: parseInt(form.category_id, 10),
            manufacturer_id: form.manufacturer_id ? parseInt(form.manufacturer_id, 10) : null,
            new_manufacturer_name: form.new_manufacturer_name.trim() || null,
            rejection_reason: form.rejection_reason.trim() || null,
            main_image_url: form.main_image_url.trim() || null,
            specs,
        };
        return base;
    };

    const saveProduct = () => {
        const body = payloadFromForm();
        if (!body.name || !body.category_id) {
            alert('Укажите название и категорию.');
            return;
        }
        setSaving(true);
        const req = editingId
            ? axios.put(`/api/admin/products/${editingId}`, body)
            : axios.post('/api/admin/products', body);
        req
            .then(() => {
                closeModal();
                fetchList(meta.current_page || 1);
                loadMeta();
            })
            .catch((err) => {
                const msg = err?.response?.data?.message || JSON.stringify(err?.response?.data?.errors || {});
                alert(typeof msg === 'string' ? msg : 'Ошибка сохранения товара');
            })
            .finally(() => setSaving(false));
    };

    const destroyProduct = (id, name) => {
        if (!window.confirm(`Удалить товар «${name}»?`)) return;
        axios
            .delete(`/api/admin/products/${id}`)
            .then(() => fetchList(meta.current_page || 1))
            .catch(() => alert('Не удалось удалить товар.'));
    };

    const updateStatusQuick = (id, nextStatus) => {
        axios.patch(`/api/admin/products/${id}/status`, { status: nextStatus }).then(() => fetchList(meta.current_page || 1));
    };

    const statusOptions = useMemo(() => ['на модерации', 'активен', 'отклонен'], []);

    return (
        <AdminLayout title="Админка - Товары" active="products">
            <div>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-black">Товары</h2>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="bg-[#08004E] hover:bg-[#060038] text-white rounded-md text-sm font-semibold px-4 py-2 transition"
                    >
                        Новый товар
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-5">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск товара"
                        className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                    >
                        <option value="">Все статусы</option>
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => fetchList(1)}
                        className="bg-[#08004E] hover:bg-[#060038] text-white rounded-md text-sm font-semibold px-4 py-2 transition"
                    >
                        Применить
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка товаров...</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Товар</th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Категория</th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Цена</th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Остаток</th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Статус</th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id} className="border-b border-gray-100">
                                            <td className="px-4 py-3 text-sm text-black font-semibold">
                                                <Link href={`/products/${product.slug || product.id}`} className="hover:text-[#08004E] transition-colors">
                                                    {product.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{product.category?.name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{Number(product.price || 0).toLocaleString('ru-RU')} ₽</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{product.quantity ?? 0}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <select
                                                    value={product.status}
                                                    onChange={(e) => updateStatusQuick(product.id, e.target.value)}
                                                    className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                                                >
                                                    {statusOptions.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-sm space-x-2 whitespace-nowrap">
                                                <button type="button" onClick={() => openEdit(product.id)} className="text-[#08004E] font-semibold hover:underline">
                                                    Изменить
                                                </button>
                                                <button type="button" onClick={() => destroyProduct(product.id, product.name)} className="text-red-600 font-semibold hover:underline">
                                                    Удалить
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
                            <span>Всего: {meta.total ?? products.length}</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={(meta.current_page || 1) <= 1}
                                    onClick={() => fetchList((meta.current_page || 1) - 1)}
                                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
                                >
                                    Назад
                                </button>
                                <span className="px-2 py-1">
                                    {meta.current_page || 1} / {meta.last_page || 1}
                                </span>
                                <button
                                    type="button"
                                    disabled={(meta.current_page || 1) >= (meta.last_page || 1)}
                                    onClick={() => fetchList((meta.current_page || 1) + 1)}
                                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
                                >
                                    Вперёд
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog">
                        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-black">{editingId ? 'Редактирование товара' : 'Новый товар'}</h3>
                                <button type="button" onClick={closeModal} className="text-gray-500 hover:text-black text-2xl leading-none px-2">
                                    ×
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Название *</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                        onBlur={() => {
                                            if (!editingId && !form.slug.trim()) {
                                                setForm((p) => ({ ...p, slug: slugFromName(p.name) }));
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Slug (URL) *</label>
                                    <input
                                        value={form.slug}
                                        onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Категория *</label>
                                    <select
                                        value={form.category_id}
                                        onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    >
                                        <option value="">—</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Производитель</label>
                                    <select
                                        value={form.manufacturer_id}
                                        onChange={(e) => setForm((p) => ({ ...p, manufacturer_id: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    >
                                        <option value="">—</option>
                                        {manufacturers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={form.new_manufacturer_name}
                                        onChange={(e) => setForm((p) => ({ ...p, new_manufacturer_name: e.target.value }))}
                                        placeholder="Или новый бренд"
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-black mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Цена *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.price}
                                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Остаток *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.quantity}
                                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Статус *</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    >
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Причина отклонения</label>
                                    <textarea
                                        value={form.rejection_reason}
                                        onChange={(e) => setForm((p) => ({ ...p, rejection_reason: e.target.value }))}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Описание</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">URL главного изображения</label>
                                    <input
                                        value={form.main_image_url}
                                        onChange={(e) => setForm((p) => ({ ...p, main_image_url: e.target.value }))}
                                        placeholder="https://..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-black">Характеристики</span>
                                    <button type="button" onClick={addSpecRow} className="text-xs font-semibold text-[#08004E] hover:underline">
                                        + строка
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {form.specs.map((row, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <input
                                                value={row.name}
                                                onChange={(e) => updateSpecRow(idx, 'name', e.target.value)}
                                                placeholder="Название"
                                                className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-black"
                                            />
                                            <input
                                                value={row.value}
                                                onChange={(e) => updateSpecRow(idx, 'value', e.target.value)}
                                                placeholder="Значение"
                                                className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-black"
                                            />
                                            <button type="button" onClick={() => removeSpecRow(idx)} className="text-red-600 text-sm px-2">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={saveProduct}
                                    className="px-4 py-2 rounded-md bg-[#08004E] text-white text-sm font-semibold hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {saving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
