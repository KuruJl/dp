import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function CategoriesIndex() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');

    const fetchCategories = () => {
        setIsLoading(true);
        axios.get('/api/admin/categories', { params: { search } })
            .then((response) => setCategories(response.data.data || []))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const createCategory = () => {
        axios.post('/api/admin/categories', { name: newName, slug: newSlug || undefined })
            .then(() => {
                setNewName('');
                setNewSlug('');
                fetchCategories();
            });
    };

    const updateCategory = (category) => {
        const name = window.prompt('Название категории', category.name);
        if (!name) return;
        const slug = window.prompt('Slug категории', category.slug);
        if (!slug) return;

        axios.patch(`/api/admin/categories/${category.id}`, { name, slug }).then(fetchCategories);
    };

    const deleteCategory = (category) => {
        if (!window.confirm(`Удалить категорию "${category.name}"?`)) return;
        axios.delete(`/api/admin/categories/${category.id}`)
            .then(fetchCategories)
            .catch((error) => alert(error?.response?.data?.message || 'Ошибка удаления.'));
    };

    return (
        <AdminLayout title="Админка - Категории" active="categories">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Категории</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название" className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]" />
                    <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="Slug (опционально)" className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]" />
                    <button onClick={createCategory} className="bg-[#08004E] hover:bg-[#060038] text-white rounded-md text-sm font-semibold px-4 py-2 transition">Добавить</button>
                    <div className="flex gap-2">
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]" />
                        <button onClick={fetchCategories} className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-md text-sm font-semibold px-4 py-2 transition">Найти</button>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка категорий...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Название</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Slug</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Товаров</th>
                                    <th className="px-4 py-3 text-right text-xs uppercase font-bold text-gray-500">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-black font-semibold">{category.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{category.slug}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{category.products_count}</td>
                                        <td className="px-4 py-3 text-sm text-right space-x-3">
                                            <button onClick={() => updateCategory(category)} className="text-[#08004E] hover:underline">Изменить</button>
                                            <button onClick={() => deleteCategory(category)} className="text-red-600 hover:underline">Удалить</button>
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
