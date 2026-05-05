import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Head, Link } from '@inertiajs/react';

import AssemblyCard from '@/Components/AssemblyCard'; 
import Header from '@/Components/Header'; 
import Footer from '@/Components/Footer'; 
import Modal from '@/Components/Modal';

export default function MyAssemblies({ auth }) {
    const [assemblies, setAssemblies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [editingAssembly, setEditingAssembly] = useState(null);
    const [descriptionText, setDescriptionText] = useState('');
    
    // --- ОШИБКА 1: ЭТО СОСТОЯНИЕ БЫЛО ПРОПУЩЕНО ---
    const [allErrors, setAllErrors] = useState({});

    useEffect(() => {
        setIsLoading(true);
        axios.get('/api/assemblies?page=1')
            .then(response => {
                const paginatedData = response.data;
                setAssemblies(paginatedData.data);
                setHasMore(paginatedData.next_page_url !== null);
                fetchCompatibilityForAssemblies(paginatedData.data);
            })
            .catch(error => console.error("Ошибка при начальной загрузке сборок:", error))
            .finally(() => setIsLoading(false));
    }, []);

    const fetchCompatibilityForAssemblies = (assembliesToCheck) => {
        const promises = assembliesToCheck.map(assembly =>
            axios.get(`/api/assemblies/${assembly.id}/compatibility`)
        );
        
        // --- ОШИБКА 2: ЭТОТ БЛОК БЫЛ ЗДЕСЬ ЛИШНИМ ---
        // axios.get(`/api/assemblies?page=${nextPage}`) ...

        Promise.all(promises)
            .then(results => {
                const newErrors = {};
                results.forEach((result, index) => {
                    const assemblyId = assembliesToCheck[index].id;
                    if (result.data && !result.data.compatible) {
                        newErrors[assemblyId] = result.data.errors;
                    }
                });
                setAllErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
            })
            .catch(error => console.error("Не удалось загрузить статусы совместимости:", error));
    };

    const openDescriptionModal = (assembly) => {
        setEditingAssembly(assembly);
        setDescriptionText(assembly.description || '');
        setIsDescriptionModalOpen(true);
    };
    
    const closeDescriptionModal = () => {
        setIsDescriptionModalOpen(false);
        setEditingAssembly(null);
        setDescriptionText('');
    };
    
    const fetchMoreAssemblies = () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        axios.get(`/api/assemblies?page=${nextPage}`)
            .then(response => {
                const paginatedData = response.data;
                const newAssemblies = paginatedData.data;

                setAssemblies(prev => [...prev, ...newAssemblies]);
                setCurrentPage(paginatedData.current_page);
                setHasMore(paginatedData.next_page_url !== null);

                // --- ОШИБКА 3: ЭТОТ ВЫЗОВ БЫЛ ЛИШНИМ ВНУТРИ fetchCompatibilityForAssemblies ---
                // Теперь он находится в правильном месте.
                fetchCompatibilityForAssemblies(newAssemblies);
            })
            .catch(error => console.error("Ошибка при подгрузке сборок:", error))
            .finally(() => setIsLoadingMore(false));
    };

    const handleSaveDescription = () => {
        if (!editingAssembly) return;
        axios.patch(`/api/assemblies/${editingAssembly.id}`, { description: descriptionText })
            .then(response => {
                setAssemblies(prev => prev.map(asm => 
                    asm.id === editingAssembly.id ? response.data.assembly : asm
                ));
                closeDescriptionModal();
                alert('Описание успешно сохранено!');
            })
            .catch(error => {
                console.error("Ошибка при сохранении описания:", error);
                alert('Не удалось сохранить описание.');
            });
    };

    const handleDelete = (assemblyId, assemblyName) => {
        if (!window.confirm(`Вы уверены, что хотите удалить сборку "${assemblyName}"?`)) return;
        axios.delete(`/api/assemblies/${assemblyId}`)
            .then(() => {
                setAssemblies(prev => prev.filter(assembly => assembly.id !== assemblyId));
                alert("Сборка удалена");
            })
            .catch(error => {
                console.error("Ошибка при удалении сборки", error);
                alert('Не удалось удалить сборку');
            });
    };

    const togglePublication = (assemblyId, currentStatus) => {
        const newStatus = !currentStatus;
        axios.patch(`/api/assemblies/${assemblyId}`, { is_public: newStatus })
            .then(response => {
                setAssemblies(prevAssemblies => 
                    prevAssemblies.map(assembly => 
                        assembly.id === assemblyId ? response.data.assembly : assembly
                    )
                );
            })
            .catch(error => {
                if (error.response && error.response.status === 422) {
                    alert(error.response.data.message);
                } else {
                    console.error("Ошибка при обновлении статуса сборки:", error);
                    alert('Не удалось обновить статус сборки. Попробуйте позже.');
                }
            });
    };

    return (
        <main className="flex flex-col min-h-screen bg-[#3A4750] font-sans text-white">
            <Header />
    
            <div className="max-w-7xl flex-grow mt-10 mx-auto px-4 sm:px-6 lg:px-8 w-full">
                {isLoading ? (
                    <p className="text-white text-center py-10">Загрузка сборок...</p>
                ) : (
                    <div className="space-y-8">
                        {assemblies.length > 0 ? (
                            assemblies.map(assembly => (
                                <div key={assembly.id} className="bg-[#303841] rounded-2xl p-4 sm:p-6 shadow-2xl">
                                    <AssemblyCard
                                        assembly={assembly}
                                        showActions={false}
                                        compatibilityErrors={allErrors[assembly.id]}
                                    />    
                                    <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                                        <button
                                            onClick={() => openDescriptionModal(assembly)}
                                            className="w-full sm:w-auto text-center px-4 py-2 text-sm rounded-md bg-green-600 hover:bg-green-500 transition"
                                        >
                                            Описание
                                        </button>
                                        <Link 
                                            href={route('configurator.edit', { assembly: assembly.id })}
                                            className="w-full sm:w-auto text-center px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 transition"
                                        >
                                            Изменить
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(assembly.id, assembly.name)}
                                            className="w-full sm:w-auto text-center px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-500 transition"
                                        >
                                            Удалить
                                        </button>
                                        <button 
                                            onClick={() => togglePublication(assembly.id, assembly.is_public)}
                                            className="w-full sm:w-auto text-center px-4 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-500 transition"
                                        >
                                            {assembly.is_public ? 'Снять с публикации' : 'Опубликовать'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-lg">У вас пока нет сохраненных сборок.</p>
                                <Link href={route('configurator')} className="mt-4 inline-block bg-sky-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-500 transition">
                                    Создать новую сборку
                                </Link>
                            </div>
                        )}
                        
                        {assemblies.length > 0 && (
                            <div className="text-center py-6">
                                {isLoadingMore && <p>Загрузка...</p>}
                                {hasMore && !isLoadingMore && (
                                    <button 
                                        onClick={fetchMoreAssemblies}
                                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition"
                                    >
                                        Ещё сборки
                                    </button>
                                )}
                                {!hasMore && (
                                    <p className="text-gray-500">Вы загрузили все сборки</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
    
            <Modal isOpen={isDescriptionModalOpen} onClose={closeDescriptionModal} title={`Описание для сборки "${editingAssembly?.name}"`}>
                <div className="space-y-4">
                    <textarea
                        value={descriptionText}
                        onChange={(e) => setDescriptionText(e.target.value)}
                        rows="6"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                        placeholder="Расскажите о вашей сборке: для каких задач она подходит, почему выбрали именно эти компоненты..."
                    />
                    <div className="flex justify-end space-x-3">
                        <button onClick={closeDescriptionModal} className="bg-gray-500 px-4 py-2 rounded-md hover:bg-gray-400">
                            Отмена
                        </button>
                        <button onClick={handleSaveDescription} className="bg-sky-600 px-4 py-2 rounded-md hover:bg-sky-500">
                            Сохранить
                        </button>
                    </div>
                </div>
            </Modal>
    
            <Footer />
        </main>
    );
}