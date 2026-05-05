// resources/js/Pages/Admin/Users/Index.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function UsersIndex({ auth }) {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = (url = '/api/admin/users') => {
        setIsLoading(true);
        axios.get(url)
            .then(response => {
                setUsers(response.data.data);
                const { data, ...paginationData } = response.data;
                setPagination(paginationData);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleAdmin = (userId) => {
        if (!confirm('Вы уверены, что хотите изменить роль этого пользователя?')) return;
        
        axios.patch(`/api/admin/users/${userId}/toggle-admin`)
            .then(() => {
                fetchUsers(pagination.path + '?page=' + pagination.current_page);
                alert('Роль успешно изменена!');
            })
            .catch(error => {
                alert(error.response?.data?.message || 'Произошла ошибка.');
            });
    };
    
    const handleDeleteUser = (userId) => {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.')) return;

        axios.delete(`/api/admin/users/${userId}`)
            .then(() => {
                fetchUsers(pagination.path + '?page=' + pagination.current_page);
                alert('Пользователь удален!');
            })
            .catch(error => {
                alert(error.response?.data?.message || 'Произошла ошибка.');
            });
    };

    return (
        <AdminLayout title="Админка - Пользователи" active="users">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Пользователи</h2>

                    {isLoading ? (
                        <p className="text-center text-gray-600 py-8">Загрузка пользователей...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Имя</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Роль</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user.id} className={`border-gray-200 ${index === users.length - 1 ? '' : 'border-b'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                    {user.is_admin ? 'Администратор' : 'Пользователь'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleToggleAdmin(user.id)} className="text-[#08004E] hover:underline transition-colors">
                                                    {user.is_admin ? 'Снять админа' : 'Сделать админом'}
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:underline transition-colors">
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