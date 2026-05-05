import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function OrdersIndex() {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const fetchOrders = (url = '/api/admin/orders') => {
        setIsLoading(true);
        axios.get(url, { params: { search, status } })
            .then((response) => {
                setOrders(response.data.data || []);
                const { data, ...meta } = response.data;
                setPagination(meta);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = (orderId, nextStatus) => {
        axios.patch(`/api/admin/orders/${orderId}/status`, { status: nextStatus })
            .then(() => fetchOrders(pagination.path ? `${pagination.path}?page=${pagination.current_page}` : '/api/admin/orders'));
    };

    return (
        <AdminLayout title="Админка - Заказы" active="orders">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Заказы</h2>

                <div className="flex flex-wrap gap-3 mb-5">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по номеру/пользователю"
                        className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                    />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                    >
                        <option value="">Все статусы</option>
                        <option value="новый">новый</option>
                        <option value="ожидает оплаты">ожидает оплаты</option>
                        <option value="оплачен">оплачен</option>
                        <option value="в доставке">в доставке</option>
                        <option value="выполнен">выполнен</option>
                        <option value="отменен">отменен</option>
                    </select>
                    <button onClick={() => fetchOrders()} className="bg-[#08004E] hover:bg-[#060038] text-white px-4 py-2 rounded-md text-sm font-semibold transition">
                        Применить
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка заказов...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Номер</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Пользователь</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Сумма</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase font-bold text-gray-500">Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-black font-semibold">{order.order_number}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{order.user?.name || 'Гость'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{Number(order.total_amount || 0).toLocaleString('ru-RU')} ₽</td>
                                        <td className="px-4 py-3 text-sm">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                className="bg-white border border-gray-200 rounded-md px-2 py-1 text-black text-xs focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]"
                                            >
                                                <option value="новый">новый</option>
                                                <option value="ожидает оплаты">ожидает оплаты</option>
                                                <option value="оплачен">оплачен</option>
                                                <option value="в доставке">в доставке</option>
                                                <option value="выполнен">выполнен</option>
                                                <option value="отменен">отменен</option>
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
