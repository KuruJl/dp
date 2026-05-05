import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function ProductsIndex() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const fetchProducts = () => {
        setIsLoading(true);
        axios.get('/api/admin/products', { params: { search, status } })
            .then((response) => setProducts(response.data.data || []))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const updateStatus = (id, nextStatus) => {
        axios.patch(`/api/admin/products/${id}/status`, { status: nextStatus }).then(fetchProducts);
    };

    return (
        <AdminLayout title="Админка - Товары" active="products">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Товары</h2>

                <div className="flex flex-wrap gap-3 mb-5">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск товара" className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]" />
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]">
                        <option value="">Все статусы</option>
                        <option value="активен">активен</option>
                        <option value="неактивен">неактивен</option>
                    </select>
                    <button onClick={fetchProducts} className="bg-[#08004E] hover:bg-[#060038] text-white rounded-md text-sm font-semibold px-4 py-2 transition">Применить</button>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка товаров...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Товар</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Категория</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Цена</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-black font-semibold">
                                            <Link href={`/products/${product.slug || product.id}`} className="hover:text-sky-300 transition-colors">
                                                {product.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{product.category?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{Number(product.price || 0).toLocaleString('ru-RU')} ₽</td>
                                        <td className="px-4 py-3 text-sm">
                                            <select
                                                value={product.status}
                                                onChange={(e) => updateStatus(product.id, e.target.value)}
                                                className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                                            >
                                                <option value="активен">активен</option>
                                                <option value="неактивен">неактивен</option>
                                            </select>
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
