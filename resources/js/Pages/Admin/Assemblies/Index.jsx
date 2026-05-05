// resources/js/Pages/Admin/Assemblies/Index.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/Admin/AdminLayout';
import Modal from '@/Components/Modal';

export default function AssembliesIndex({ auth }) {
    const [assemblies, setAssemblies] = useState([]);
    const [pagination, setPagination] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingAssembly, setViewingAssembly] = useState(null);

    const fetchAssemblies = (url = '/api/admin/assemblies') => {
        setIsLoading(true);
        axios.get(url)
            .then(response => {
                setAssemblies(response.data.data);
                const { data, ...paginationData } = response.data;
                setPagination(paginationData);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchAssemblies();
    }, []);

    const handleViewAssembly = (assemblyId) => {
        setViewingAssembly(null);
        setIsViewModalOpen(true);
        axios.get(`/api/admin/assemblies/${assemblyId}`)
            .then(response => {
                setViewingAssembly(response.data);
            })
            .catch(error => {
                console.error("Ошибка при загрузке сборки:", error);
                alert('Не удалось загрузить данные сборки.');
                setIsViewModalOpen(false);
            });
    };

    const handleTogglePublication = (assemblyId) => {
        if (!confirm('Вы уверены, что хотите изменить статус публикации этой сборки?')) return;
        axios.patch(`/api/admin/assemblies/${assemblyId}/toggle-publication`)
            .then(response => {
                fetchAssemblies(pagination.path + '?page=' + pagination.current_page);
                alert(response.data.message);
            })
            .catch(error => alert('Произошла ошибка.'));
    };

    const handleDeleteAssembly = (assemblyId) => {
        if (!confirm('Вы уверены, что хотите удалить эту сборку?')) return;
        axios.delete(`/api/admin/assemblies/${assemblyId}`)
            .then(response => {
                fetchAssemblies(pagination.path + '?page=' + pagination.current_page);
                alert(response.data.message);
            })
            .catch(error => alert('Произошла ошибка.'));
    };

    return (
        <AdminLayout title="Админка - Сборки" active="assemblies">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Сборки</h2>

                    {isLoading ? (
                        <p className="text-center text-gray-600 py-8">Загрузка сборок...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Название</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Автор</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Статус</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Лайки / Комм.</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assemblies.map((assembly, index) => (
                                        <tr key={assembly.id} className={`border-gray-200 ${index === assemblies.length - 1 ? '' : 'border-b'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black">{assembly.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assembly.user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${assembly.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                                                    {assembly.is_public ? 'Опубликована' : 'Приватная'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assembly.likers_count} / {assembly.comments_count}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleViewAssembly(assembly.id)} className="text-[#08004E] hover:underline transition-colors">
                                                    Просмотр
                                                </button>
                                                <Link
                                                    href={route('configurator.edit', { assembly: assembly.id })}
                                                    className="text-gray-700 hover:underline transition-colors"
                                                >
                                                    Редактировать
                                                </Link>
                                                <button onClick={() => handleTogglePublication(assembly.id)} className="text-[#08004E] hover:underline transition-colors">
                                                    {assembly.is_public ? 'Снять' : 'Опубликовать'}
                                                </button>
                                                <button onClick={() => handleDeleteAssembly(assembly.id)} className="text-red-600 hover:underline transition-colors">
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

            {/* --- ВОТ НЕДОСТАЮЩИЙ БЛОК --- */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Просмотр сборки "${viewingAssembly?.name || ''}"`}>
                {!viewingAssembly ? (
                    <p className="py-4">Загрузка данных...</p>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p><strong>Автор:</strong> {viewingAssembly.user.name}</p>
                            <p><strong>Статус:</strong> {viewingAssembly.is_public ? 'Опубликована' : 'Приватная'}</p>
                            <p><strong>Итоговая стоимость:</strong> {
                                viewingAssembly.components.reduce((sum, c) => sum + c.price, 0).toLocaleString('ru-RU')
                            } ₽</p>
                        </div>
                        <h4 className="font-bold text-lg border-t pt-4 border-gray-600">Комплектующие:</h4>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {viewingAssembly.components.map(component => (
                                <div key={component.id} className="flex items-center bg-gray-900/50 p-2 rounded-lg">
                                    <img 
                                        src={component.image_url} 
                                        alt={component.name}
                                        className="w-12 h-12 object-contain mr-4 bg-white rounded-md shrink-0"
                                    />
                                    <div className="flex-grow">
                                        <p className="text-xs text-gray-400">{component.category.name}</p>
                                        <p className="font-semibold text-white text-sm">{component.name}</p>
                                    </div>
                                    <p className="text-sky-400 font-semibold ml-4 shrink-0">
                                        {component.price.toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}